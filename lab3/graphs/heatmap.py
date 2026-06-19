# pages/heatmap.py

import streamlit as st
import altair as alt

def show(df):

    st.header("2.3 Heatmap")

    heat_data = (
        df.groupby(['day', 'time'])['total_bill']
        .mean()
        .reset_index()
    )

    heat_data.columns = [
        'day',
        'time',
        'avg_bill'
    ]

    heatmap = (
        alt.Chart(heat_data)
        .mark_rect()
        .encode(
            x='day:N',
            y='time:N',
            color='avg_bill:Q'
        )
    )

    st.altair_chart(
        heatmap,
        use_container_width=True
    )

    st.write( 
        "Darker green cells indicate higher average bills. " 
        "Hover over any cell to see the exact average bill value." 
        )