
import streamlit as st
import pandas as pd
import altair as alt

st.set_page_config(
    page_title="SDG Dashboard",
    page_icon="🌍",
    layout="wide"
)

# =====================================================
# Load Data
# =====================================================

@st.cache_data
def load_data():
    current = pd.read_csv("sustainable_development_report_2023.csv")
    historical = pd.read_csv("sdg_index_2000-2022.csv")
    return current, historical

df, history = load_data()

# =====================================================
# Title
# =====================================================

st.title("🌍 Sustainable Development Goals Dashboard")
st.subheader("Interactive dashboard exploring SDG performance across countries and regions.")

st.divider()

# =====================================================
# Sidebar
# =====================================================

st.sidebar.title(
                """
                 Lab 2 - Assignment
                 Muhammad Firman Syah - 22005583
                """)

page = st.sidebar.selectbox(
    "Choose a section",
    [
        "1. Exploratory Graphics",
        "2. Presentation Graphics",
        "3. Linked Highlighting",
        "4. SDG Reflection"
    ]
)

# =====================================================
# 1. Exploratory Graphics
# =====================================================

if page == "1. Exploratory Graphics":

    st.header("Exploratory Graphics")

    scatter = (
        alt.Chart(df)
        .mark_circle(size=120)
        .encode(
            x=alt.X(
                "goal_8_score:Q",
                title="SDG 8 Score (Economic Growth)"
            ),
            y=alt.Y(
                "overall_score:Q",
                title="Overall SDG Score"
            ),
            color="region:N",
            tooltip=[
                "country:N",
                "region:N",
                "overall_score:Q",
                "goal_8_score:Q"
            ]
        )
        .interactive()
    )

    st.altair_chart(scatter, use_container_width=True)

    st.subheader("Interpretation")

    st.write("""
    The scatter plot shows a generally positive relationship between SDG 8
    performance and overall SDG achievement. Countries with stronger economic
    growth indicators tend to obtain higher overall SDG scores. Interactive
    tooltips allow users to explore regional differences and identify outliers.
    """)

# =====================================================
# 2. Presentation Graphics
# =====================================================

elif page == "2. Presentation Graphics":

    st.header("Presentation Graphics")

    region_avg = (
        df.groupby("region")["overall_score"]
        .mean()
        .reset_index()
    )

    bar = (
        alt.Chart(region_avg)
        .mark_bar()
        .encode(
            x=alt.X("region:N", sort="-y", title="Region"),
            y=alt.Y("overall_score:Q", title="Average SDG Score"),
            color="region:N"
        )
    )

    st.altair_chart(bar, use_container_width=True)

    st.subheader("Interpretation")

    st.write("""
    This chart compares the average SDG performance across world regions.
    Regions such as OECD countries generally achieve higher SDG scores,
    while developing regions face greater challenges. The chart provides
    a clear summary of regional development differences.
    """)

# =====================================================
# 3. Linked Highlighting
# =====================================================

elif page == "3. Linked Highlighting":

    st.header("Linked Highlighting")

    region_avg = (
        df.groupby("region")["overall_score"]
        .mean()
        .reset_index()
    )

    highlight = alt.selection_point(
        fields=["region"],
        on="mouseover"
    )

    bar = (
        alt.Chart(region_avg)
        .mark_bar()
        .encode(
            x=alt.X("region:N", sort="-y"),
            y="overall_score:Q",
            color=alt.condition(
                highlight,
                "region:N",
                alt.value("lightgray")
            )
        )
        .add_params(highlight)
    )

    scatter = (
        alt.Chart(df)
        .mark_circle(size=100)
        .encode(
            x="goal_8_score:Q",
            y="overall_score:Q",
            color=alt.condition(
                highlight,
                "region:N",
                alt.value("lightgray")
            ),
            tooltip=[
                "country",
                "region",
                "overall_score"
            ]
        )
    )

    linked = bar & scatter

    st.altair_chart(linked, use_container_width=True)

    st.subheader("Explanation")

    st.write("""
    Linked highlighting connects the regional summary with individual country
    performance. When users hover over a region, the countries belonging to
    that region become highlighted in the scatter plot. This interaction helps
    reveal regional clusters and patterns that would be difficult to identify
    using a single chart.
    """)

# =====================================================
# 4. SDG Reflection
# =====================================================

elif page == "4. SDG Reflection":

    st.header("SDG 7: Affordable and Clean Energy")

    selected = history[
        history["country"].isin([
            "Malaysia",
            "Singapore",
            "Indonesia",
            "Thailand",
            "Vietnam"
        ])
    ]

    line = (
        alt.Chart(selected)
        .mark_line(point=True)
        .encode(
            x="year:O",
            y=alt.Y(
                "goal_7_score:Q",
                title="SDG 7 Score"
            ),
            color="country:N",
            tooltip=[
                "country",
                "year",
                "goal_7_score"
            ]
        )
    )

    st.altair_chart(line, use_container_width=True)

    st.subheader("Reflection")

    st.write("""
    SDG 7 focuses on ensuring access to affordable, reliable, sustainable,
    and modern energy for all. The visualization shows that many countries
    have improved their SDG 7 performance over time, although progress varies
    depending on economic development, energy policies, and investment in
    renewable technologies. Countries with stronger infrastructure and greater
    financial resources often achieve higher scores because they can invest
    more heavily in clean energy solutions and efficient power systems.

    The importance of SDG 7 extends beyond energy access alone. Reliable and
    sustainable energy supports education, healthcare, industry, and overall
    economic growth. It also plays a major role in reducing greenhouse gas
    emissions and addressing climate change. By monitoring SDG 7 indicators,
    governments and organizations can identify areas that require improvement
    and allocate resources more effectively. Data visualization makes these
    trends easier to understand and helps decision-makers evaluate whether
    policies are producing meaningful progress toward a more sustainable future.
    """)
