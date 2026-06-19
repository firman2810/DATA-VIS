import streamlit as st
import plotly.express as px

def show(df):

    st.header("5. Mosaic Style Visualization")

    summary = (
        df.groupby(["Region","Category"])
        ["Sales"]
        .sum()
        .reset_index()
    )

    fig = px.treemap(
        summary,
        path=["Region","Category"],
        values="Sales",
        color="Sales",
        color_continuous_scale="Reds"
    )

    st.plotly_chart(fig, use_container_width=True)

    st.write("""
    The treemap provides a mosaic-style view of sales distribution.
    Larger blocks represent higher sales contributions.
    """)