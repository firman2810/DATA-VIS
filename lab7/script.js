const tooltip = d3.select("#tooltip");

const width = 700;
const height = 400;

const margin = {
    top: 40,
    right: 40,
    bottom: 60,
    left: 80
};

const parseDate = d3.timeParse("%d-%m-%Y");

d3.csv("Walmart_Sales.csv").then(data => {

    data.forEach(d => {

        d.Store = +d.Store;
        d.Date = parseDate(d.Date);
        d.Weekly_Sales = +d.Weekly_Sales;
        d.Holiday_Flag = +d.Holiday_Flag;
        d.Fuel_Price = +d.Fuel_Price;

    });

    // Populate Store Filter
    const stores = [...new Set(data.map(d => d.Store))].sort((a, b) => a - b);

    stores.forEach(store => {

        d3.select("#storeFilter")
            .append("option")
            .attr("value", store)
            .text(store);

    });

    function getFilteredData() {

        let filtered = data;

        const store = d3.select("#storeFilter").property("value");
        const holiday = d3.select("#holidayFilter").property("value");

        if (store !== "All") {
            filtered = filtered.filter(d => d.Store == store);
        }

        if (holiday !== "All") {
            filtered = filtered.filter(d => d.Holiday_Flag == holiday);
        }

        return filtered;

    }

    function updateDashboard() {

        const filtered = getFilteredData();

        d3.select("#lineChart").html("");
        d3.select("#barChart").html("");
        d3.select("#donutChart").html("");
        d3.select("#scatterPlot").html("");

        drawLineChart(filtered);
        drawBarChart(filtered);
        drawDonutChart(filtered);
        drawScatterPlot(filtered);

    }

    d3.select("#storeFilter").on("change", updateDashboard);
    d3.select("#holidayFilter").on("change", updateDashboard);

    updateDashboard();

});


//======================
// Line Chart
//======================

function drawLineChart(data) {

    const svg = d3.select("#lineChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.Date))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Weekly_Sales)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height-margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    const line = d3.line()
        .x(d => x(d.Date))
        .y(d => y(d.Weekly_Sales));

    svg.append("path")
        .datum(data.sort((a, b) => a.Date - b.Date))
        .attr("fill", "none")
        .attr("stroke", "#1f77b4")
        .attr("stroke-width", 2)
        .attr("d", line);

    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.Date))
        .attr("cy", d => y(d.Weekly_Sales))
        .attr("r", 3)
        .attr("fill", "#1f77b4")
        .on("mouseover", (event, d) => {

            tooltip
                .style("visibility", "visible")
                .html(
                    `<b>Date:</b> ${d3.timeFormat("%d-%m-%Y")(d.Date)}<br>
                     <b>Sales:</b> ${d.Weekly_Sales.toLocaleString()}`
                );

        })
        .on("mousemove", event => {

            tooltip
                .style("top", (event.pageY - 40) + "px")
                .style("left", (event.pageX + 10) + "px");

        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));

}


//======================
// Bar Chart
//======================

function drawBarChart(data) {

    const sales = Array.from(

        d3.rollup(
            data,
            v => d3.sum(v, d => d.Weekly_Sales),
            d => d.Store
        ),

        ([Store, Sales]) => ({ Store, Sales })

    );

    const maxSales = d3.max(sales, d => d.Sales);

    const svg = d3.select("#barChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(sales.map(d => d.Store))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, maxSales])
        .nice()
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height-margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svg.selectAll("rect")
        .data(sales)
        .enter()
        .append("rect")
        .attr("x", d => x(d.Store))
        .attr("y", d => y(d.Sales))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d.Sales))
        .attr("fill", d => d.Sales == maxSales ? "orange" : "steelblue")
        .on("mouseover", (event, d) => {

            tooltip
                .style("visibility", "visible")
                .html(
                    `<b>Store:</b> ${d.Store}<br>
                     <b>Total Sales:</b> ${Math.round(d.Sales).toLocaleString()}`
                );

        })
        .on("mousemove", event => {

            tooltip
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 40 + "px");

        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));

}


//======================
// Donut Chart
//======================

function drawDonutChart(data) {

    const donutData = [

        {
            label: "Holiday",
            value: d3.sum(data.filter(d => d.Holiday_Flag == 1), d => d.Weekly_Sales)
        },

        {
            label: "Non-Holiday",
            value: d3.sum(data.filter(d => d.Holiday_Flag == 0), d => d.Weekly_Sales)
        }

    ];

    const radius = 150;

    const svg = d3.select("#donutChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width/2},${height/2})`);

    const color = d3.scaleOrdinal()
        .domain(["Holiday", "Non-Holiday"])
        .range(["tomato", "steelblue"]);

    const pie = d3.pie()
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(70)
        .outerRadius(radius);

    svg.selectAll("path")
        .data(pie(donutData))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.label))
        .on("mouseover", (event, d) => {

            const total = d3.sum(donutData, x => x.value);

            const percent = (d.data.value / total * 100).toFixed(1);

            tooltip
                .style("visibility", "visible")
                .html(
                    `<b>${d.data.label}</b><br>${percent}%`
                );

        })
        .on("mousemove", event => {

            tooltip
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 40 + "px");

        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));

    // Legend
    const legend = d3.select("#donutChart svg");

    donutData.forEach((d, i) => {

        legend.append("rect")
            .attr("x", 20)
            .attr("y", 20 + i * 25)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(d.label));

        legend.append("text")
            .attr("x", 45)
            .attr("y", 32 + i * 25)
            .text(d.label);

    });

}


//======================
// Scatter Plot
//======================

function drawScatterPlot(data) {

    const svg = d3.select("#scatterPlot")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Fuel_Price))
        .nice()
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Weekly_Sales)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height-margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.Fuel_Price))
        .attr("cy", d => y(d.Weekly_Sales))
        .attr("r", 5)
        .attr("fill", d => d.Holiday_Flag ? "red" : "green")
        .attr("opacity", 0.7)
        .on("mouseover", (event, d) => {

            tooltip
                .style("visibility", "visible")
                .html(
                    `<b>Store:</b> ${d.Store}<br>
                     <b>Fuel Price:</b> ${d.Fuel_Price}<br>
                     <b>Sales:</b> ${d.Weekly_Sales.toLocaleString()}`
                );

        })
        .on("mousemove", event => {

            tooltip
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 40 + "px");

        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));

}