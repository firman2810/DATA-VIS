import streamlit as st
import plotly.express as px

def show(df):

    st.header("3. Multivariate Scatter Plot")

    fig = px.scatter(
        df,
        x="Sales",
        y="Profit",
        color="Category",
        size="Quantity",
        hover_name="Sub-Category",
        title="Multivariate Analysis"
    )

    st.plotly_chart(fig, use_container_width=True)

    st.write("""
    This visualization combines Sales, Profit, Quantity and Category in a single chart.
    Larger bubbles represent higher quantities sold.
    """)