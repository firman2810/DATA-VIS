import streamlit as st
import plotly.express as px

def show(df):

    st.header(
        "2.6 Grand Tour (3D Scatter)"
    )

    fig = px.scatter_3d(
        df,
        x='total_bill',
        y='tip',
        z='size',
        color='day',
        symbol='sex',
        size='tip',
        size_max=15,
        opacity=0.8,
        hover_data=[
            'smoker',
            'time'
        ],
        color_discrete_sequence=
        px.colors.qualitative.Set2
    )

    fig.update_layout(
        scene=dict(
            xaxis_title='Total Bill ($)',
            yaxis_title='Tip ($)',
            zaxis_title='Group Size'
        )
    )

    st.plotly_chart(
        fig,
        use_container_width=True
    )

    st.write( 
		"Rotate the chart by clicking and dragging. Zoom with the scroll wheel. " 
		"Color represents the day, shape represents sex, and point size represents tip amount." 
        )
