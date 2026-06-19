# pages/mosaic.py

import streamlit as st
import altair as alt

def show(df):

    st.header("2.1 Mosaic Plot")

    mosaic_data = (
        df.groupby(['day', 'sex'])['total_bill']
        .sum()
        .reset_index()
    )

    chart = (
        alt.Chart(mosaic_data)
        .mark_bar()
        .encode(
            x='day:N',
            y=alt.Y(
                'total_bill:Q',
                stack='normalize'
            ),
            color='sex:N'
        )
    )

    st.altair_chart(
        chart,
        use_container_width=True
    )

    st.write( 
		"Each bar shows the proportion of total bill contributed by Male vs Female " 
		"customers for each day. Wider bars indicate more data for that day." 
	) 
