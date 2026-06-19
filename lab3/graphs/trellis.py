import streamlit as st
import plotly.express as px

def show(df):

    st.header("1. Trellis Plot")

    fig = px.scatter(
        df,
        x="Sales",
        y="Profit",
        color="Category",
        facet_col="Region",
        hover_data=["Sub-Category"],
        title="Sales vs Profit by Region"
    )

    fig.update_traces(marker=dict(size=8))

    st.plotly_chart(fig, use_container_width=True)

    st.write("""
    The trellis plot compares Sales and Profit across different regions.
    Splitting the chart by region makes it easier to identify regional differences in performance.
    """)