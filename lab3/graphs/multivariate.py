import streamlit as st
import altair as alt

def show(df):

    st.header("2.4 Multivariate Scatter Plot")

    chart = (
        alt.Chart(df)
        .mark_point(
            filled=True,
            opacity=0.8
        )
        .encode(
            x='total_bill:Q',
            y='tip:Q',
            color='sex:N',
            shape='smoker:N',
            size=alt.Size(
                'size:Q',
                scale=alt.Scale(
                    range=[50, 400]
                )
            ),
            tooltip=[
                'total_bill',
                'tip',
                'sex',
                'smoker',
                'size',
                'day'
            ]
        )
        .interactive()
    )

    st.altair_chart(
        chart,
        use_container_width=True
    )

    st.write( 
		"Each point encodes 5 variables: x position (bill), y position (tip), " 
		"color (sex), shape (smoker), and size (group size). " 
		"Hover over points for full details." 
	)