import streamlit as st
import plotly.express as px

def show(df):

    st.header("4. Parallel Coordinates")

    df_parallel = df[
        ["Sales","Profit","Quantity","Discount","Category"]
    ].copy()

    df_parallel["Category"] = (
        df_parallel["Category"]
        .astype("category")
        .cat.codes
    )

    fig = px.parallel_coordinates(
        df_parallel,
        color="Category",
        title="Parallel Coordinates Plot"
    )

    st.plotly_chart(fig, use_container_width=True)

    st.write("""
    Parallel coordinates allow comparison of multiple variables simultaneously.
    Each line represents an individual transaction.
    """)