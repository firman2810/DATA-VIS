// =============================================================================
// SECTION 1: CONFIGURATION
// =============================================================================

const CONFIG = {

    // Chart margins (top, right, bottom, left)
    margins: {
        line: { top: 30, right: 30, bottom: 50, left: 60 },
        bar: { top: 20, right: 20, bottom: 55, left: 140 },
        scatter: { top: 30, right: 120, bottom: 60, left: 60 },
        hist: { top: 30, right: 20, bottom: 50, left: 60 }
    },

    // Default viewBox dimensions (used as aspect ratio)
    viewBox: {
        line: { w: 800, h: 350 },
        bar: { w: 450, h: 380 },
        scatter: { w: 520, h: 350 },
        hist: { w: 500, h: 350 },
        treemap: { w: 500, h: 350 }
    },

    // Shared severity color scale
    severityColors: {
        domain: ["Low", "Medium", "High", "Critical"],
        range: ["#0EA5E9", "#F97316", "#8B5CF6", "#EF4444"]
    },

    // Chart colors
    colors: {
        primary: "#22C55E",
        primaryDark: "#15803D",
        accent: "#16A34A",
        barDefault: "#22C55E",
        barSelected: "#15803D",
        barHover: "#16A34A",
        histDefault: "#16A34A",
        histHover: "#15803D"
    },

    // Animation durations (ms)
    duration: {
        barGrow: 800,
        scatterGrow: 800,
        histGrow: 900,
        treemapGrow: 900,
        hoverFast: 150
    },

    // Grid opacity
    gridOpacity: 0.08,

    // Table row limit
    tableRowLimit: 100,

    // Histogram bin count
    histBins: 15,

    // Point radii
    pointRadius: {
        default: 5,
        hover: 8
    },

    // Resize debounce delay (ms)
    resizeDelay: 250
};

// =============================================================================
// SECTION 2: APPLICATION STATE
// =============================================================================

let rawData = [];
let filteredData = [];
let selectedDisease = null;
let selectedPatient = null;
let tableCurrentPage = 1;
const TABLE_PAGE_SIZE = 10;

// =============================================================================
// SECTION 3: DOM REFERENCES (cached once)
// =============================================================================

const DOM = {
    sidebar: document.getElementById("sidebar"),
    toggleSidebar: document.getElementById("toggleSidebar"),
    navItems: document.querySelectorAll(".nav-item"),
    pages: document.querySelectorAll(".page"),
    searchBox: document.getElementById("searchBox"),
    resetButton: document.getElementById("resetDashboard"),

    // Filters
    yearFilter: document.getElementById("yearFilter"),
    diseaseFilter: document.getElementById("diseaseFilter"),
    stateFilter: document.getElementById("stateFilter"),
    hospitalFilter: document.getElementById("hospitalFilter"),
    genderFilter: document.getElementById("genderFilter"),

    // KPI elements
    kpiPatients: document.getElementById("kpiPatients"),
    kpiRecovery: document.getElementById("kpiRecovery"),
    kpiCost: document.getElementById("kpiCost"),
    kpiMortality: document.getElementById("kpiMortality"),

    // Content areas
    patientTable: document.getElementById("patientTable"),
    tablePagination: document.getElementById("tablePagination"),
    summaryPanel: document.getElementById("summaryPanel"),
    analysisContent: document.getElementById("analysisContent")
};

const filterElements = [
    DOM.yearFilter,
    DOM.diseaseFilter,
    DOM.stateFilter,
    DOM.hospitalFilter,
    DOM.genderFilter
];


// =============================================================================
// SECTION 4: UTILITY — TOOLTIP (single shared instance)
// =============================================================================

const Tooltip = (() => {

    let el = null;

    function getElement() {
        if (!el) {
            el = d3.select("body")
                .append("div")
                .attr("class", "chart-tooltip")
                .node();
        }
        return d3.select(el);
    }

    function show(event, html) {
        const tip = getElement();
        tip.html(html)
            .style("opacity", 1)
            .style("left", (event.pageX + 14) + "px")
            .style("top", (event.pageY - 24) + "px");
    }

    function move(event) {
        const tip = getElement();
        tip.style("left", (event.pageX + 14) + "px")
            .style("top", (event.pageY - 24) + "px");
    }

    function hide() {
        const tip = getElement();
        tip.style("opacity", 0);
    }

    return { show, move, hide };

})();

// =============================================================================
// SECTION 5: UTILITY — SVG FACTORY
// =============================================================================

/**
 * Creates an SVG with viewBox, appends a margin-translated <g>, and returns
 * { svg, width, height } where width/height are the inner drawing dimensions.
 */
function createChartSvg(selector, margin, vb) {

    const container = document.querySelector(selector);

    d3.select(selector).selectAll("*").remove();

    const totalW = vb.w;
    const totalH = vb.h;
    const width = totalW - margin.left - margin.right;
    const height = totalH - margin.top - margin.bottom;

    const svg = d3.select(selector)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${totalW} ${totalH}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    return { svg, width, height };
}

/**
 * Adds horizontal grid lines to a chart.
 */
function addGridLines(svg, yScale, width) {
    svg.append("g")
        .attr("class", "grid-lines")
        .call(
            d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat("")
        )
        .attr("stroke-opacity", CONFIG.gridOpacity);
}

/**
 * Renders a centered "No data available" message inside an SVG group.
 */
function showNoData(svg, width, height) {
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#94A3B8")
        .text("No data available");
}

/**
 * Creates the shared severity color scale.
 */
function severityColorScale() {
    return d3.scaleOrdinal()
        .domain(CONFIG.severityColors.domain)
        .range(CONFIG.severityColors.range);
}

// =============================================================================
// SECTION 6: DATA LOADING & PREPROCESSING
// =============================================================================

d3.csv("indian_diseases_dataset.csv")
    .then(data => {
        rawData = data;
        preprocessData();
        initializeFilters();
        applyFilters();
    })
    .catch(error => {
        console.error("Failed to load dataset:", error);
    });

function preprocessData() {
    rawData.forEach(d => {
        d.age = +d.age;
        d.bmi = +d.bmi;
        d.recovery_days = +d.recovery_days;
        d.treatment_cost_inr = +d.treatment_cost_inr;
        d.length_of_stay = +d.length_of_stay;

        // Parse date in DD/MM/YYYY format safely
        if (d.diagnosis_date) {
            const dateStr = String(d.diagnosis_date);
            const parts = dateStr.split("/");
            if (parts.length === 3) {
                const day = +parts[0];
                const month = +parts[1] - 1; // 0-based month in JS
                const year = +parts[2];
                d.diagnosis_date = new Date(year, month, day);
            } else {
                d.diagnosis_date = new Date(dateStr);
            }
        } else {
            d.diagnosis_date = new Date(NaN);
        }

        if (!d.comorbidity) d.comorbidity = "None";
        if (!d.alcohol_use) d.alcohol_use = "Unknown";
        if (!d.cause_of_death) d.cause_of_death = "Not Applicable";
    });
}

// =============================================================================
// SECTION 7: NAVIGATION & UI EVENTS
// =============================================================================

// Sidebar toggle
DOM.toggleSidebar.addEventListener("click", () => {
    DOM.sidebar.classList.toggle("collapsed");
});

// Page navigation
DOM.navItems.forEach(item => {
    item.addEventListener("click", () => {
        DOM.navItems.forEach(nav => nav.classList.remove("active"));
        item.classList.add("active");

        DOM.pages.forEach(page => page.classList.remove("active-page"));
        document.getElementById(item.dataset.page).classList.add("active-page");
    });
});

// Reset dashboard
// Reset dashboard
DOM.resetButton.addEventListener("click", () => {
    DOM.searchBox.value = "";
    selectedDisease = null;
    selectedPatient = null;
    tableCurrentPage = 1;
    filterElements.forEach(f => f.value = "All");
    applyFilters();
});

// Search
DOM.searchBox.addEventListener("keyup", () => {
    applyFilters();
});

// =============================================================================
// SECTION 8: FILTER LOGIC
// =============================================================================

function initializeFilters() {
    const uniqueSorted = (accessor, numeric) => {
        const values = [...new Set(rawData.map(accessor))].filter(v => v !== undefined && v !== null && v !== "" && !Number.isNaN(v));
        return numeric
            ? values.sort((a, b) => a - b)
            : values.sort();
    };

    populateFilter(DOM.yearFilter,     uniqueSorted(d => d.diagnosis_date.getFullYear(), true), "Select Year");
    populateFilter(DOM.diseaseFilter,  uniqueSorted(d => d.disease_name), "Select Disease");
    populateFilter(DOM.stateFilter,    uniqueSorted(d => d.state), "Select State");
    populateFilter(DOM.hospitalFilter, uniqueSorted(d => d.hospital_type), "Select Hospital");
    populateFilter(DOM.genderFilter,   uniqueSorted(d => d.gender), "Select Gender");
}

function populateFilter(select, values, placeholderText) {
    select.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "All";
    allOption.textContent = placeholderText || "All";
    select.appendChild(allOption);

    values.forEach(value => {
        if (value == null || value === "") return;
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

// Attach change listeners to all filters
filterElements.forEach(filter => {
    filter.addEventListener("change", applyFilters);
});

/**
 * Checks whether a datum matches a single filter.
 */
function matchesFilter(filterValue, dataValue) {
    return filterValue === "All" || String(dataValue) === filterValue;
}

function applyFilters() {
    const keyword = DOM.searchBox.value.toLowerCase();
    tableCurrentPage = 1;

    filteredData = rawData.filter(d => {
        if (!matchesFilter(DOM.yearFilter.value, d.diagnosis_date.getFullYear())) return false;
        if (!matchesFilter(DOM.diseaseFilter.value, d.disease_name)) return false;
        if (!matchesFilter(DOM.stateFilter.value, d.state)) return false;
        if (!matchesFilter(DOM.hospitalFilter.value, d.hospital_type)) return false;
        if (!matchesFilter(DOM.genderFilter.value, d.gender)) return false;

        if (keyword !== "") {
            const searchable = (
                d.disease_name + " " +
                d.hospital_type + " " +
                d.state
            ).toLowerCase();
            if (!searchable.includes(keyword)) return false;
        }

        return true;
    });


    updateDashboard();
}

// =============================================================================
// SECTION 9: DASHBOARD UPDATE (single definition)
// =============================================================================

function updateDashboard() {
    updateKPIs();
    updateSummaryPanel();
    updateAnalysisContent();
    updatePatientTable();
    drawLineChart();
    drawBarChart();
    drawScatterPlot();
    drawHistogram();
    drawTreemap();
}

// =============================================================================
// SECTION 10: KPI UPDATE
// =============================================================================

function updateKPIs() {
    const total = filteredData.length;

    // Total Patients
    DOM.kpiPatients.textContent = total.toLocaleString();

    // Recovery Rate
    const recovered = filteredData.filter(d =>
        d.outcome && d.outcome.toLowerCase() === "recovered"
    ).length;
    const recoveryRate = total === 0 ? 0 : (recovered / total) * 100;
    DOM.kpiRecovery.textContent = recoveryRate.toFixed(1) + "%";

    // Average Treatment Cost
    const avgCost = d3.mean(filteredData, d => d.treatment_cost_inr) || 0;
    DOM.kpiCost.textContent = "₹" + Math.round(avgCost).toLocaleString();

    // Mortality Rate
    const deaths = filteredData.filter(d =>
        d.outcome && (
            d.outcome.toLowerCase() === "death" ||
            d.outcome.toLowerCase() === "deceased"
        )
    ).length;
    const mortalityRate = total === 0 ? 0 : (deaths / total) * 100;
    DOM.kpiMortality.textContent = mortalityRate.toFixed(1) + "%";
}

// =============================================================================
// SECTION 11: PATIENT TABLE
// =============================================================================

function updatePatientTable() {
    const tbody = DOM.patientTable;
    tbody.innerHTML = "";

    const totalRecords = filteredData.length;
    const totalPages = Math.ceil(totalRecords / TABLE_PAGE_SIZE);

    // Clamp current page to safe boundaries
    if (tableCurrentPage < 1) tableCurrentPage = 1;
    if (tableCurrentPage > totalPages && totalPages > 0) tableCurrentPage = totalPages;

    const startIndex = (tableCurrentPage - 1) * TABLE_PAGE_SIZE;
    const endIndex = Math.min(startIndex + TABLE_PAGE_SIZE, totalRecords);
    const displayData = filteredData.slice(startIndex, endIndex);

    const fragment = document.createDocumentFragment();
    displayData.forEach(d => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${d.disease_name}</td>
            <td>${d.age}</td>
            <td>${d.gender}</td>
            <td>${d.hospital_type}</td>
            <td>${d.outcome}</td>
        `;
        fragment.appendChild(row);
    });
    tbody.appendChild(fragment);

    // Render pagination controls
    const paginationContainer = DOM.tablePagination;
    paginationContainer.innerHTML = "";

    if (totalRecords === 0) {
        paginationContainer.innerHTML = "<span>No records found</span>";
        return;
    }

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.disabled = tableCurrentPage === 1;
    prevBtn.addEventListener("click", () => {
        tableCurrentPage--;
        updatePatientTable();
    });

    const infoSpan = document.createElement("span");
    infoSpan.textContent = `Page ${tableCurrentPage} of ${totalPages} (${startIndex + 1}–${endIndex} of ${totalRecords})`;

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.disabled = tableCurrentPage === totalPages;
    nextBtn.addEventListener("click", () => {
        tableCurrentPage++;
        updatePatientTable();
    });

    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(infoSpan);
    paginationContainer.appendChild(nextBtn);
}

// =============================================================================
// SECTION 12: SUMMARY PANEL
// =============================================================================

function updateSummaryPanel() {
    const panel = DOM.summaryPanel;
    const total = filteredData.length;
    const avgAge = d3.mean(filteredData, d => d.age) || 0;
    const avgBMI = d3.mean(filteredData, d => d.bmi) || 0;
    const avgRecovery = d3.mean(filteredData, d => d.recovery_days) || 0;

    panel.innerHTML = `
        <div class="summary-grid">
            <div class="summary-metric">
                <div class="metric-value">${total.toLocaleString()}</div>
                <div class="metric-label">Total Patients</div>
            </div>
            <div class="summary-metric">
                <div class="metric-value">${avgAge.toFixed(1)} years</div>
                <div class="metric-label">Average Age</div>
            </div>
            <div class="summary-metric">
                <div class="metric-value">${avgBMI.toFixed(1)}</div>
                <div class="metric-label">Average BMI</div>
            </div>
            <div class="summary-metric">
                <div class="metric-value">${avgRecovery.toFixed(1)} days</div>
                <div class="metric-label">Average Recovery</div>
            </div>
        </div>
    `;
}

// =============================================================================
// SECTION 13: ANALYSIS PAGE
// =============================================================================

function updateAnalysisContent() {
    const panel = DOM.analysisContent;

    if (filteredData.length === 0) {
        panel.innerHTML = "<p>No data available for analysis.</p>";
        return;
    }

    const total = filteredData.length;
    const avgAge = d3.mean(filteredData, d => d.age) || 0;
    const avgBMI = d3.mean(filteredData, d => d.bmi) || 0;
    const avgCost = d3.mean(filteredData, d => d.treatment_cost_inr) || 0;
    const avgStay = d3.mean(filteredData, d => d.length_of_stay) || 0;
    const avgRecov = d3.mean(filteredData, d => d.recovery_days) || 0;

    // Top disease
    const topDisease = d3.rollups(filteredData, v => v.length, d => d.disease_name)
        .sort((a, b) => b[1] - a[1])[0];

    // Top state
    const topState = d3.rollups(filteredData, v => v.length, d => d.state)
        .sort((a, b) => b[1] - a[1])[0];

    // Gender split list
    const genderSplit = d3.rollups(filteredData, v => v.length, d => d.gender);
    const genderListHtml = genderSplit
        .map(([gName, count]) => `
            <li class="analysis-stat-item">
                <span class="stat-key">${gName}</span>
                <span class="stat-val">${count.toLocaleString()} (${((count / total) * 100).toFixed(1)}%)</span>
            </li>
        `).join("");

    // Outcome breakdown list
    const outcomes = d3.rollups(filteredData, v => v.length, d => d.outcome)
        .sort((a, b) => b[1] - a[1]);
    const outcomeListHtml = outcomes
        .map(([oName, count]) => `
            <li class="analysis-stat-item">
                <span class="stat-key">${oName || "Unknown"}</span>
                <span class="stat-val">${count.toLocaleString()} (${((count / total) * 100).toFixed(1)}%)</span>
            </li>
        `).join("");

    panel.innerHTML = `
        <div class="analysis-grid">

            <div class="analysis-stat-card">
                <h4>📊 Dataset Overview</h4>
                <div class="stat-value">${total.toLocaleString()}</div>
                <p>Total patient records in current selection</p>
            </div>

            <div class="analysis-stat-card">
                <h4>🏥 Most Common Disease</h4>
                <div class="stat-value">${topDisease ? topDisease[0] : "N/A"}</div>
                <p>${topDisease ? topDisease[1].toLocaleString() + " cases recorded" : ""}</p>
            </div>

            <div class="analysis-stat-card">
                <h4>📍 Most Affected State</h4>
                <div class="stat-value">${topState ? topState[0] : "N/A"}</div>
                <p>${topState ? topState[1].toLocaleString() + " patients total" : ""}</p>
            </div>

            <div class="analysis-stat-card">
                <h4>👤 Demographics</h4>
                <ul class="analysis-stat-list">
                    <li class="analysis-stat-item">
                        <span class="stat-key">Average Age</span>
                        <span class="stat-val">${avgAge.toFixed(1)} years</span>
                    </li>
                    <li class="analysis-stat-item">
                        <span class="stat-key">Average BMI</span>
                        <span class="stat-val">${avgBMI.toFixed(1)}</span>
                    </li>
                    ${genderListHtml}
                </ul>
            </div>

            <div class="analysis-stat-card">
                <h4>💰 Cost & Stay</h4>
                <ul class="analysis-stat-list">
                    <li class="analysis-stat-item">
                        <span class="stat-key">Avg Treatment Cost</span>
                        <span class="stat-val">₹${Math.round(avgCost).toLocaleString()}</span>
                    </li>
                    <li class="analysis-stat-item">
                        <span class="stat-key">Avg Hospital Stay</span>
                        <span class="stat-val">${avgStay.toFixed(1)} days</span>
                    </li>
                    <li class="analysis-stat-item">
                        <span class="stat-key">Avg Recovery Days</span>
                        <span class="stat-val">${avgRecov.toFixed(1)} days</span>
                    </li>
                </ul>
            </div>

            <div class="analysis-stat-card">
                <h4>📋 Outcome Breakdown</h4>
                <ul class="analysis-stat-list">
                    ${outcomeListHtml}
                </ul>
            </div>

        </div>
    `;
}


// =============================================================================
// SECTION 14: LINE CHART
// =============================================================================

function drawLineChart() {

    const { svg, width, height } = createChartSvg(
        "#lineChart",
        CONFIG.margins.line,
        CONFIG.viewBox.line
    );

    // Group data by year
    const yearlyData = d3.rollups(
        filteredData,
        v => v.length,
        d => d.diagnosis_date.getFullYear()
    )
        .map(([year, count]) => ({ year: +year, count }))
        .sort((a, b) => a.year - b.year);

    if (yearlyData.length === 0) {
        showNoData(svg, width, height);
        return;
    }

    // Scales
    const x = d3.scaleLinear()
        .domain(d3.extent(yearlyData, d => d.year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(yearlyData, d => d.count)])
        .nice()
        .range([height, 0]);

    // Grid
    addGridLines(svg, y, width);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Axis labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Patient Count");

    // Line
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.count))
        .curve(d3.curveMonotoneX);

    svg.append("path")
        .datum(yearlyData)
        .attr("fill", "none")
        .attr("stroke", CONFIG.colors.accent)
        .attr("stroke-width", 4)
        .attr("d", line);

    // Points with tooltip
    svg.selectAll("circle")
        .data(yearlyData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.count))
        .attr("r", CONFIG.pointRadius.default)
        .attr("fill", CONFIG.colors.accent)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
            d3.select(this).transition().duration(CONFIG.duration.hoverFast)
                .attr("r", CONFIG.pointRadius.hover);
            Tooltip.show(event, `
                <strong>${d.year}</strong><br>
                Cases: ${d.count.toLocaleString()}
            `);
        })
        .on("mousemove", function (event) {
            Tooltip.move(event);
        })
        .on("mouseout", function () {
            d3.select(this).transition().duration(CONFIG.duration.hoverFast)
                .attr("r", CONFIG.pointRadius.default);
            Tooltip.hide();
        });

    // Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "600")
        .text("Disease Cases by Year");
}

// =============================================================================
// SECTION 15: BAR CHART
// =============================================================================

function drawBarChart() {

    const { svg, width, height } = createChartSvg(
        "#barChart",
        CONFIG.margins.bar,
        CONFIG.viewBox.bar
    );

    // Aggregate top 10 diseases
    const diseaseData = d3.rollups(
        filteredData,
        v => v.length,
        d => d.disease_name
    )
        .map(([disease, count]) => ({ disease, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    if (diseaseData.length === 0) {
        showNoData(svg, width, height);
        return;
    }

    // Scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(diseaseData, d => d.count)])
        .nice()
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(diseaseData.map(d => d.disease))
        .range([0, height])
        .padding(0.25);

    // Grid
    svg.append("g")
        .call(
            d3.axisBottom(x)
                .tickSize(height)
                .tickFormat("")
        )
        .attr("stroke-opacity", CONFIG.gridOpacity);

    // Axes
    svg.append("g").call(d3.axisLeft(y));
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Axis labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Patient Count");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -120)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Disease");

    // Bar fill helper
    const barFill = d => selectedDisease === d.disease
        ? CONFIG.colors.barSelected
        : CONFIG.colors.barDefault;

    // Bars
    svg.selectAll("rect")
        .data(diseaseData)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", d => y(d.disease))
        .attr("height", y.bandwidth())
        .attr("width", 0)
        .attr("rx", 10)
        .attr("fill", barFill)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", CONFIG.colors.barHover);
            Tooltip.show(event, `
                <strong>${d.disease}</strong><br>
                Patients: ${d.count.toLocaleString()}
            `);
        })
        .on("mousemove", function (event) {
            Tooltip.move(event);
        })
        .on("mouseout", function (event, d) {
            d3.select(this).attr("fill", barFill(d));
            Tooltip.hide();
        })
        .on("click", function (event, d) {
            selectedDisease = selectedDisease === d.disease ? null : d.disease;
            applyFilters();
        })
        .transition()
        .duration(CONFIG.duration.barGrow)
        .attr("width", d => x(d.count));

    // Value labels
    svg.selectAll(".label")
        .data(diseaseData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d.count) + 8)
        .attr("y", d => y(d.disease) + y.bandwidth() / 2 + 5)
        .text(d => d.count)
        .style("font-size", "12px");
}

// =============================================================================
// SECTION 16: SCATTER PLOT
// =============================================================================

function drawScatterPlot() {

    const { svg, width, height } = createChartSvg(
        "#scatterPlot",
        CONFIG.margins.scatter,
        CONFIG.viewBox.scatter
    );

    // Filter out invalid data
    const data = filteredData.filter(d =>
        !isNaN(d.bmi) && !isNaN(d.recovery_days)
    );

    if (data.length === 0) {
        showNoData(svg, width, height);
        return;
    }

    // Scales
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.bmi))
        .nice()
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.recovery_days))
        .nice()
        .range([height, 0]);

    const color = severityColorScale();

    // Grid
    addGridLines(svg, y, width);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Axis labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .attr("text-anchor", "middle")
        .text("BMI");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -42)
        .attr("text-anchor", "middle")
        .text("Recovery Days");

    // Points
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.bmi))
        .attr("cy", d => y(d.recovery_days))
        .attr("r", 0)
        .attr("fill", d => color(d.severity))
        .attr("opacity", 0.75)
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
            d3.select(this).transition().duration(CONFIG.duration.hoverFast)
                .attr("r", CONFIG.pointRadius.hover)
                .attr("opacity", 1);
            Tooltip.show(event, `
                <strong>${d.disease_name}</strong><br>
                BMI: ${d.bmi}<br>
                Recovery: ${d.recovery_days} days<br>
                Severity: ${d.severity}
            `);
        })
        .on("mousemove", function (event) {
            Tooltip.move(event);
        })
        .on("mouseout", function () {
            d3.select(this).transition().duration(CONFIG.duration.hoverFast)
                .attr("r", CONFIG.pointRadius.default)
                .attr("opacity", 0.75);
            Tooltip.hide();
        })
        .on("click", function (event, d) {
            selectedPatient = d;
            updateSummaryPanel();
        })
        .transition()
        .duration(CONFIG.duration.scatterGrow)
        .attr("r", CONFIG.pointRadius.default);

    // Legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, 10)`);

    color.domain().forEach((level, i) => {
        const row = legend.append("g")
            .attr("transform", `translate(0,${i * 22})`);

        row.append("circle")
            .attr("r", 6)
            .attr("fill", color(level));

        row.append("text")
            .attr("x", 15)
            .attr("y", 5)
            .style("font-size", "12px")
            .text(level);
    });
}

// =============================================================================
// SECTION 17: HISTOGRAM
// =============================================================================

function drawHistogram() {

    const { svg, width, height } = createChartSvg(
        "#histogram",
        CONFIG.margins.hist,
        CONFIG.viewBox.hist
    );

    // Extract values
    const values = filteredData
        .map(d => d.treatment_cost_inr)
        .filter(d => !isNaN(d));

    if (values.length === 0) {
        showNoData(svg, width, height);
        return;
    }

    // Scales
    const x = d3.scaleLinear()
        .domain(d3.extent(values))
        .nice()
        .range([0, width]);

    // Bins
    const bins = d3.bin()
        .domain(x.domain())
        .thresholds(CONFIG.histBins)
        (values);

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .nice()
        .range([height, 0]);

    // Grid
    addGridLines(svg, y, width);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(6));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Axis labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Treatment Cost (INR)");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Patient Count");

    // Bars
    svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", d => x(d.x0) + 1)
        .attr("y", height)
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 2))
        .attr("height", 0)
        .attr("fill", CONFIG.colors.histDefault)
        .attr("rx", 6)
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", CONFIG.colors.histHover);
            Tooltip.show(event, `
                <strong>Range</strong><br>
                ₹${Math.round(d.x0).toLocaleString()} – ₹${Math.round(d.x1).toLocaleString()}<br><br>
                Patients: ${d.length.toLocaleString()}
            `);
        })
        .on("mousemove", function (event) {
            Tooltip.move(event);
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", CONFIG.colors.histDefault);
            Tooltip.hide();
        })
        .transition()
        .duration(CONFIG.duration.histGrow)
        .attr("y", d => y(d.length))
        .attr("height", d => height - y(d.length));

    // Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "600")
        .text("Treatment Cost Distribution");
}

// =============================================================================
// SECTION 18: TREEMAP
// =============================================================================

function drawTreemap() {

    d3.select("#treemap").selectAll("*").remove();

    const vb = CONFIG.viewBox.treemap;

    const svg = d3.select("#treemap")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${vb.w} ${vb.h}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Aggregate severity data
    const severityData = d3.rollups(
        filteredData,
        v => v.length,
        d => d.severity
    ).map(([name, value]) => ({ name, value }));

    if (severityData.length === 0) {
        svg.append("text")
            .attr("x", vb.w / 2)
            .attr("y", vb.h / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "#94A3B8")
            .text("No data available");
        return;
    }

    // Hierarchy + layout
    const root = d3.hierarchy({ children: severityData })
        .sum(d => d.value);

    d3.treemap()
        .size([vb.w, vb.h])
        .padding(4)
        (root);

    const color = severityColorScale();

    // Cells
    const cells = svg.selectAll("g")
        .data(root.leaves())
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    cells.append("rect")
        .attr("width", 0)
        .attr("height", 0)
        .attr("rx", 10)
        .attr("fill", d => color(d.data.name))
        .on("mouseover", function (event, d) {
            d3.select(this).attr("opacity", 0.8);
            Tooltip.show(event, `
                <strong>${d.data.name}</strong><br>
                Patients: ${d.data.value.toLocaleString()}
            `);
        })
        .on("mousemove", function (event) {
            Tooltip.move(event);
        })
        .on("mouseout", function () {
            d3.select(this).attr("opacity", 1);
            Tooltip.hide();
        })
        .transition()
        .duration(CONFIG.duration.treemapGrow)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0);

    // Labels
    cells.append("text")
        .attr("x", 10)
        .attr("y", 22)
        .style("fill", "white")
        .style("font-size", "13px")
        .style("font-weight", "600")
        .text(d => d.data.name);

    cells.append("text")
        .attr("x", 10)
        .attr("y", 42)
        .style("fill", "white")
        .style("font-size", "12px")
        .text(d => d.data.value);
}

// =============================================================================
// SECTION 19: WINDOW RESIZE HANDLER
// =============================================================================

let resizeTimer = null;

window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (filteredData.length > 0) {
            updateDashboard();
        }
    }, CONFIG.resizeDelay);
});