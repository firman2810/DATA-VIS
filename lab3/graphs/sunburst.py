import streamlit as st
import plotly.express as px

def show(df):

    st.header("7. Sunburst Chart")

    fig = px.sunburst(
        df,
        path=["Region","Category","Sub-Category"],
        values="Sales",
        title="Sales Distribution by Region and Category"
    )

    st.plotly_chart(fig, use_container_width=True)

    st.write("""
    The sunburst chart displays hierarchical sales distribution.
    Users can quickly identify which regions and categories contribute most to total sales.
    """)