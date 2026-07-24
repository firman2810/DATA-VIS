// ------------------------------
// Configuration
// ------------------------------
const width = 4800;
const height = 650;
const margin = { top: 100, right: 80, bottom: 80, left: 80 };

// ------------------------------
// SVG and Tooltip
// ------------------------------
const svg = d3.select("#timeline")
    .attr("width", width)
    .attr("height", height);

const tooltip = d3.select("#tooltip");

// ------------------------------
// Global Variables
// ------------------------------
let allData = [];
let filteredData = [];
let colorScale;

// =======================================================
// LOAD CSV
// =======================================================
d3.csv("World Important Dates.csv").then(data => {
    allData = data
        .map(d => ({
            year: +d.Year,
            incident: d["Name of Incident"],
            date: d.Date,
            country: d.Country,
            outcome: d.Outcome,
            type: d["Type of Event"],
            place: d["Place Name"],
            impact: d.Impact
        }))
        .filter(d => d.year && d.incident && d.country)
        .sort((a, b) => a.year - b.year)
        .slice(0, 100); // Keep only first 100 events

    populateFilters();
    updateDashboard();
});

// =======================================================
// POPULATE FILTERS
// =======================================================
function populateFilters() {
    // Country Filter Options
    const countries = [...new Set(allData.map(d => d.country))].sort();
    countries.forEach(country => {
        d3.select("#countryFilter")
            .append("option")
            .attr("value", country)
            .text(country);
    });

    // Outcome Filter Options
    const outcomes = [...new Set(allData.map(d => d.outcome))].sort();
    outcomes.forEach(outcome => {
        d3.select("#outcomeFilter")
            .append("option")
            .attr("value", outcome)
            .text(outcome);
    });
}

// =======================================================
// EVENT LISTENERS
// =======================================================
d3.select("#searchInput").on("input", updateDashboard);
d3.select("#countryFilter").on("change", updateDashboard);
d3.select("#outcomeFilter").on("change", updateDashboard);

d3.select("#resetBtn").on("click", () => {
    d3.select("#searchInput").property("value", "");
    d3.select("#countryFilter").property("value", "All");
    d3.select("#outcomeFilter").property("value", "All");
    updateDashboard();
});

// =======================================================
// UPDATE DASHBOARD
// =======================================================
function updateDashboard() {
    const keyword = d3.select("#searchInput").property("value").toLowerCase();
    const selectedCountry = d3.select("#countryFilter").property("value");
    const selectedOutcome = d3.select("#outcomeFilter").property("value");

    filteredData = allData.filter(d => {
        const matchSearch = d.incident.toLowerCase().includes(keyword);
        const matchCountry = selectedCountry === "All" || d.country === selectedCountry;
        const matchOutcome = selectedOutcome === "All" || d.outcome === selectedOutcome;
        return matchSearch && matchCountry && matchOutcome;
    });

    updateSummary();
    drawTimeline();
}

// =======================================================
// SUMMARY CARDS
// =======================================================
function updateSummary() {
    d3.select("#totalEvents").text(filteredData.length);

    if (filteredData.length === 0) {
        d3.select("#earliestYear").text("-");
        d3.select("#latestYear").text("-");
        d3.select("#countryCount").text("0");
        return;
    }

    d3.select("#earliestYear").text(d3.min(filteredData, d => d.year));
    d3.select("#latestYear").text(d3.max(filteredData, d => d.year));
    d3.select("#countryCount").text(new Set(filteredData.map(d => d.country)).size);
}

// =======================================================
// DRAW TIMELINE
// =======================================================
function drawTimeline() {
    svg.selectAll("*").remove();
    d3.select("#legend").html("");

    if (filteredData.length === 0) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", 22)
            .text("No events found.");
        return;
    }

    const timelineY = height / 2;
    const minYear = d3.min(filteredData, d => d.year);
    const maxYear = d3.max(filteredData, d => d.year);

    const xScale = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range([margin.left, width - margin.right]);

    // Color Scale (Outcome) using built-in Tableau10 palette
    const outcomes = [...new Set(filteredData.map(d => d.outcome))];
    colorScale = d3.scaleOrdinal()
        .domain(outcomes)
        .range(d3.schemeTableau10);

    // Vertical Grid Lines
    svg.append("g")
        .selectAll("line")
        .data(d3.range(minYear, maxYear + 1))
        .enter()
        .append("line")
        .attr("class", "year-grid")
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d))
        .attr("y1", 60)
        .attr("y2", height - 60);

    // Timeline Axis Line
    svg.append("line")
        .attr("class", "timeline-line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", timelineY)
        .attr("y2", timelineY);

    // X-Axis
    const axis = d3.axisBottom(xScale)
        .ticks(20)
        .tickFormat(d3.format("d"));

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${timelineY})`)
        .call(axis);

    // Timeline Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 45)
        .attr("fill", "white")
        .attr("font-size", 24)
        .attr("font-weight", "600")
        .attr("text-anchor", "middle")
        .text("World Historical Events");

    // Event Row Layout Assignment
    filteredData.forEach((d, i) => {
        d.row = i % 8;
    });

    // Draw Events
    const groups = svg.selectAll(".event")
        .data(filteredData)
        .enter()
        .append("g")
        .attr("class", "event")
        .attr("transform", d => {
            const x = xScale(d.year);
            const direction = d.row % 2 === 0 ? -1 : 1;
            const level = Math.floor(d.row / 2);
            const y = timelineY + direction * (70 + level * 45);
            d.drawY = y;
            return `translate(${x},${y})`;
        });

    // Connector Lines
    groups.append("line")
        .attr("class", "event-line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", d => timelineY - d.drawY);

    // Event Circles
    groups.append("circle")
        .attr("class", "event-circle")
        .attr("fill", d => colorScale(d.outcome))
        .attr("r", 0)
        .transition()
        .duration(700)
        .attr("r", 8);

    // Event Labels
    groups.append("text")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "11px")
        .attr("y", d => d.row % 2 === 0 ? -18 : 24)
        .text(d => d.incident.length > 18 ? d.incident.substring(0, 18) + "..." : d.incident);

    // Tooltip Mouse Interactions
    groups
        .on("mouseover", function (event, d) {
            d3.select(this)
                .select("circle")
                .transition()
                .duration(120)
                .attr("r", 12);

            tooltip
                .style("opacity", 1)
                .html(`
                    <strong>${d.incident}</strong>
                    <hr>
                    <b>Date:</b> ${d.date}<br>
                    <b>Country:</b> ${d.country}<br>
                    <b>Outcome:</b> ${d.outcome}<br>
                    <b>Type:</b> ${d.type}<br>
                    <b>Impact:</b> ${d.impact}
                `);
        })
        .on("mousemove", function (event) {
            tooltip
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 25) + "px");
        })
        .on("mouseout", function () {
            d3.select(this)
                .select("circle")
                .transition()
                .duration(120)
                .attr("r", 8);

            tooltip.style("opacity", 0);
        });

    // Draw Legend
    drawLegend();
}

// =======================================================
// DRAW LEGEND
// =======================================================
function drawLegend() {
    const legend = d3.select("#legend");
    legend.html("");

    if (!colorScale) return;

    const outcomes = colorScale.domain();
    outcomes.forEach(outcome => {
        const item = legend
            .append("div")
            .attr("class", "legend-item");

        item.append("div")
            .attr("class", "legend-color")
            .style("background", colorScale(outcome));

        item.append("span")
            .text(outcome);
    });
}

// =======================================================
// WINDOW EVENT LISTENERS
// =======================================================
window.addEventListener("load", () => {
    document.body.animate(
        [
            { opacity: 0 },
            { opacity: 1 }
        ],
        {
            duration: 600,
            easing: "ease-out"
        }
    );
});

window.addEventListener("resize", () => {
    updateDashboard();
});