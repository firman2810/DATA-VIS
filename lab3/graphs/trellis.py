import streamlit as st
import altair as alt

def show(df):

    st.header("2.2 Trellis Display")

    chart = (
        alt.Chart(df)
        .mark_circle(
            size=60,
            opacity=0.7
        )
        .encode(
            x=alt.X(
                'total_bill:Q',
                title='Total Bill ($)'
            ),
            y=alt.Y(
                'tip:Q',
                title='Tip ($)'
            ),
            color=alt.Color(
                'sex:N',
                scale=alt.Scale(scheme='set1')
            ),
            tooltip=[
                'total_bill',
                'tip',
                'sex',
                'size'
            ]
        )
        .facet(
            facet='day:N',
            columns=2
        )
    )

    st.altair_chart(chart, use_container_width=True)

    st.write(
        "Each panel shows the relationship between total bill and tip for one day. "
            "Notice how the pattern changes across days." 
        )