import streamlit as st
import plotly.express as px

def show(df):

    st.header("6. Grand Tour (3D Scatter)")

    fig = px.scatter_3d(
        df,
        x="Sales",
        y="Profit",
        z="Quantity",
        color="Category",
        hover_name="Sub-Category",
        title="3D Grand Tour"
    )

    st.plotly_chart(fig, use_container_width=True)

    st.write("""
    The 3D scatter plot provides an overview of relationships between Sales,
    Profit and Quantity simultaneously.
    """)