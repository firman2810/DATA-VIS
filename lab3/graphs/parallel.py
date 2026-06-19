import streamlit as st
import plotly.express as px

def show(df):

    st.header(
        "2.5 Parallel Coordinate Plot"
    )

    plot_df = df.copy()

    day_map = {
        'Thur': 0,
        'Fri': 1,
        'Sat': 2,
        'Sun': 3
    }

    plot_df['day_num'] = (
        plot_df['day']
        .map(day_map)
    )

    fig = px.parallel_coordinates(
        plot_df,
        dimensions=[
            'total_bill',
            'tip',
            'size'
        ],
        color='day_num',
        color_continuous_scale=
        px.colors.sequential.Viridis
    )

    st.plotly_chart(
        fig,
        use_container_width=True
    )

    st.write( 
		"Lines cluster together when records share similar patterns. " 
		"Drag the axis ranges to filter and highlight subsets of data." 
	)
