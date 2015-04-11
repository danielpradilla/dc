function crossfilter_with_dc(datapath){
  d3.csv(datapath, function(data) {

    // Various formatters.
    var formatNumber = d3.format(",d"),
        formatChange = d3.format("+,d"),
        formatDate = d3.time.format("%B %d, %Y"),
        formatTime = d3.time.format("%I:%M %p");

    // A nest operator, for grouping the flight list.
    var nestByDate = d3.nest()
        .key(function(d) { return d3.time.day(d.date); });

    // Like d3.time.format, but faster.
    function parseDate(d) {
      return new Date(2001,
          d.substring(0, 2) - 1,
          d.substring(2, 4),
          d.substring(4, 6),
          d.substring(6, 8));
    }

    // A little coercion, since the CSV is untyped.
    data.forEach(function(d, i) {
      d.index = i;
      d.date = parseDate(d.date);
      d.delay = +d.delay;
      d.distance = +d.distance;
    });

    // Create the crossfilter for the relevant dimensions and groups.
    var facts = crossfilter(data),
        all = facts.groupAll(),
        date = facts.dimension(function(d) { return d.date; }),
        dates = date.group(d3.time.day),
        hour = facts.dimension(function(d) { return d.date.getHours() + d.date.getMinutes() / 60; }),
        hours = hour.group(Math.floor),
        delay = facts.dimension(function(d) { return Math.max(-60, Math.min(149, d.delay)); }),
        delays = delay.group(function(d) { return Math.floor(d / 10) * 10; }),
        distance = facts.dimension(function(d) { return Math.min(1999, d.distance); }),
        distances = distance.group(function(d) { return Math.floor(d / 50) * 50; });

    var charts=[];
    var hourBarChart = dc.barChart("#hour-chart-dc")
                        .width(250).height(130)
                        .margins({top: 10, right: 10, bottom: 20, left: 5})
                        .centerBar(true)
                        .xUnits(function(){return 22;}) //bar width
                        .dimension(hour)
                        .group(hours)
                        .x(d3.scale.linear()
                            .domain([0, 24])
                            .rangeRound([0, 10 * 24]))
                        ;
    charts.push(hourBarChart);

    var delayBarChart = dc.barChart("#delay-chart-dc")
                        .width(250).height(130)
                        .margins({top: 10, right: 10, bottom: 20, left: 5})
                          .centerBar(true)
                          .xUnits(function(){return 20;}) //bar width
                          .dimension(delay)
                          .group(delays)
                          .x(d3.scale.linear()
                            .domain([-60, 150])
                            .rangeRound([0, 10 * 21]))
                          ;
    charts.push(delayBarChart);

    var distanceBarChart = dc.barChart("#distance-chart-dc")
                        .width(420).height(130)
                        .margins({top: 10, right: 15, bottom: 20, left: 5})
                          .centerBar(true)
                          .xUnits(function(){return 38;}) //bar width
                          .dimension(distance)
                          .group(distances)
                        .x(d3.scale.linear()
                          .domain([0, 2000])
                          .rangeRound([0, 10 * 40]));
    charts.push(distanceBarChart);

    var dateBarChart = dc.barChart("#date-chart-dc")
                          .width(920).height(130)
                        .margins({top: 10, right: 10, bottom: 20, left: 5})
                          .centerBar(true)
                          .dimension(date)
                        .group(dates)
                      .xUnits(d3.time.days)
                      .x(d3.time.scale()
                        .domain([new Date(2001, 0, 1), new Date(2001, 3, 1)])
                        .rangeRound([0, 10 * 90]));
                        //.filter([new Date(2001, 1, 1), new Date(2001, 2, 1)]);
    charts.push(dateBarChart);


    dc.dataCount('#totals-dc')
          .dimension(facts)
          .group(all)
          .html({
              some:'<strong>%filter-count</strong> selected out of <strong>%total-count</strong> flights' +
                  ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'\'>Reset All</a>',
              all:'All flights selected. Please click on any chart to apply filters.'
          });

    window.reset_dc = function(i) {
      charts[i].filterAll();
      charts[i].redraw();
    };

    // reset all charts
    window.reset_all_dc = function() {
      charts.forEach(function(chart,i) {
        chart.filterAll();
        chart.redraw();
      });
    };

    dc.renderAll();
    $(document).trigger('end-dc-charts',charts);
  });
}