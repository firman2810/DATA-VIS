import streamlit as st
import pandas as pd
import altair as alt
import plotly.express as px

st.set_page_config(
    page_title="Superstore Dashboard",
    page_icon="📊",
    layout="wide"
)

# ====================================
# Load Data
# ====================================

@st.cache_data
def load_data():
    df = pd.read_csv(
        "Sample - Superstore.csv",
        encoding="latin1"
    )

    df["Order Date"] = pd.to_datetime(df["Order Date"])
    return df

df = load_data()

# ====================================
# Sidebar
# ====================================

st.sidebar.title("Superstore Dashboard")

page = st.sidebar.selectbox(
    "Choose View",
    [
        "SALES Analysis",
        "Bar + Scatter",
        "Line + Histogram",
        "Pie + Bar",
        "Map + Scatter"
    ]
)

st.sidebar.markdown("""  MUHAMMAD FIRMAN SYAH - 22005583 """)

st.title("Superstore Sales Dashboard")
st.divider()

# ====================================
# 1. SALES ANALYSIS
# ====================================

if page == "SALES Analysis":

    st.header("SALES Analysis")

    sales_filter = st.slider(
        "Minimum Sales",
        int(df["Sales"].min()),
        int(df["Sales"].max()),
        100
    )

    categories = ["All"] + sorted(df["Category"].unique())

    selected_category = st.selectbox(
        "Category",
        categories
    )

    filtered_df = df[df["Sales"] >= sales_filter]

    if selected_category != "All":
        filtered_df = filtered_df[
            filtered_df["Category"] == selected_category
        ]

    st.subheader("Sales by Category")

    bar_chart = alt.Chart(filtered_df).mark_bar().encode(
        x="Category",
        y="sum(Sales)",
        color="Category"
    )

    st.altair_chart(bar_chart, use_container_width=True)

    sales_by_category = (
        filtered_df.groupby("Category")["Sales"]
        .sum()
        .reset_index()
    )

    pie_fig = px.pie(
        sales_by_category,
        names="Category",
        values="Sales",
        title="Sales Distribution"
    )

    st.plotly_chart(pie_fig, use_container_width=True)

# ====================================
# 2. BAR + SCATTER
# ====================================

elif page == "Bar + Scatter":

    st.title("Bar Chart + Scatter Plot")

    categories = sorted(df["Category"].unique())

    selected_category = st.selectbox(
        "Select Category",
        categories
    )

    col1, col2 = st.columns(2)

    category_sales = (
        df.groupby("Category")["Sales"]
        .sum()
        .reset_index()
    )

    bar_chart = alt.Chart(category_sales).mark_bar().encode(
        x="Category",
        y="Sales",
        color="Category"
    )

    with col1:
        st.altair_chart(bar_chart, use_container_width=True)

    filtered_df = df[df["Category"] == selected_category]

    scatter = alt.Chart(filtered_df).mark_circle(size=80).encode(
        x="Price:Q" if "Price" in filtered_df.columns else "Sales:Q",
        y="Quantity:Q",
        tooltip=[
            "Product Name",
            "Sales",
            "Quantity"
        ]
    )

    with col2:
        st.altair_chart(scatter, use_container_width=True)

# ====================================
# 3. LINE + HISTOGRAM
# ====================================

elif page == "Line + Histogram":

    st.title("Line Chart + Histogram")

    monthly_sales = (
        df.groupby(
            pd.Grouper(
                key="Order Date",
                freq="ME"
            )
        )["Sales"]
        .sum()
        .reset_index()
    )

    line_chart = alt.Chart(monthly_sales).mark_line(
        point=True
    ).encode(
        x="Order Date:T",
        y="Sales:Q"
    )

    st.altair_chart(line_chart, use_container_width=True)

    selected_month = st.selectbox(
        "Select Month",
        monthly_sales["Order Date"]
        .dt.strftime("%Y-%m")
        .unique()
    )

    filtered_df = df[
        df["Order Date"]
        .dt.strftime("%Y-%m")
        == selected_month
    ]

    histogram = alt.Chart(filtered_df).mark_bar().encode(
        alt.X("Quantity:Q", bin=True),
        y="count()"
    )

    st.altair_chart(histogram, use_container_width=True)

# ====================================
# 4. PIE + BAR
# ====================================

elif page == "Pie + Bar":

    st.title("Pie Chart + Bar Chart")

    category = st.selectbox(
        "Select Category",
        sorted(df["Category"].unique())
    )

    category_sales = (
        df.groupby("Category")["Sales"]
        .sum()
        .reset_index()
    )

    pie = px.pie(
        category_sales,
        names="Category",
        values="Sales"
    )

    st.plotly_chart(pie, use_container_width=True)

    filtered_df = df[df["Category"] == category]

    region_sales = (
        filtered_df.groupby("Region")["Sales"]
        .sum()
        .reset_index()
    )

    bar = alt.Chart(region_sales).mark_bar().encode(
        x="Region",
        y="Sales",
        color="Region"
    )

    st.altair_chart(bar, use_container_width=True)

# ====================================
# 5. MAP + SCATTER
# ====================================

elif page == "Map + Scatter":

    st.title("Map View + Scatter Plot")

    country_sales = (
        df.groupby("Country")
        .agg({
            "Sales": "sum",
            "Quantity": "sum"
        })
        .reset_index()
    )

    map_fig = px.choropleth(
        country_sales,
        locations="Country",
        locationmode="country names",
        color="Sales",
        hover_name="Country"
    )

    st.plotly_chart(
        map_fig,
        use_container_width=True
    )

    selected_country = st.selectbox(
        "Select Country",
        sorted(df["Country"].unique())
    )

    filtered_df = df[
        df["Country"] == selected_country
    ]

    scatter = alt.Chart(filtered_df).mark_circle(
        size=80
    ).encode(
        x="Sales",
        y="Quantity",
        color="Category",
        tooltip=[
            "Product Name",
            "Sales",
            "Quantity"
        ]
    )

    st.altair_chart(
        scatter,
        use_container_width=True
    )