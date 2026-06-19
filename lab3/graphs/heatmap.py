import streamlit as st
import plotly.express as px
import pandas as pd

def show(df):

    st.header("2. Heatmap")

    heat_data = pd.pivot_table(
        df,
        values="Profit",
        index="Category",
        columns="Region",
        aggfunc="sum"
    )

    fig = px.imshow(
        heat_data,
        text_auto=True,
        color_continuous_scale="Blues",
        title="Profit Heatmap by Region and Category"
    )

    st.plotly_chart(fig, use_container_width=True)

    st.write("""
    Darker colors indicate higher profits.
    Technology performs strongly across most regions.
    """)