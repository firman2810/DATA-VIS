import streamlit as st
import geopandas as gpd
import pandas as pd
import numpy as np
import folium
from streamlit_folium import folium_static


# Page Configuration
st.set_page_config(
    page_title="Data Visualization Lab 4",
    layout="wide"
)


# Generate Population Data
def generate_population_data():
    states = [
        "Johor",
        "Kedah",
        "Kelantan",
        "Melaka",
        "Negeri Sembilan",
        "Pahang",
        "Pulau Pinang",
        "Perak",
        "Perlis",
        "Sabah",
        "Sarawak",
        "Selangor",
        "Terengganu",
        "Kuala Lumpur",
        "Labuan",
        "Putrajaya"
    ]

    population = np.random.randint(
        500000,
        5000000,
        size=len(states)
    )

    return pd.DataFrame({
        "State": states,
        "Population": population
    })


# Load Malaysia Map
@st.cache_data
def load_map():
    return gpd.read_file("malaysia_states.json")


# Create Choropleth Map
def plot_map(malaysia_map, data):

    m = folium.Map(
        location=[4.2105, 101.9758],
        zoom_start=6
    )

    choropleth = folium.Choropleth(
        geo_data=malaysia_map,
        name="Population Distribution",
        data=data,
        columns=["State", "Population"],
        key_on="feature.properties.name",
        fill_color="YlOrRd",
        fill_opacity=0.7,
        line_opacity=0.2,
        legend_name="Population Distribution"
    ).add_to(m)
    
    malaysia_map = malaysia_map.merge(
        data,
        left_on="name",
        right_on="State",
        how="left"
    )

    folium.GeoJson(
        malaysia_map,
        tooltip=folium.GeoJsonTooltip(
        fields=["name", "Population"],
        aliases=["State:", "Population:"],
        localize=True
        )   
    ).add_to(m)

    return m

# Main App
def main():

    st.markdown(
        """
        <h1 style='text-align:center;'>
            Malaysia Population Distribution Map
        </h1>
        <h2 style='text-align:center;'>
            by Firman 22005583
        </h2>
        """,
        unsafe_allow_html=True
    )

    st.divider()

    # Generate Data
    population_data = generate_population_data()

    # Sidebar Filters
    st.sidebar.header("Filters")

    selected_states = st.sidebar.multiselect(
        "Select State(s)",
        options=population_data["State"].tolist(),
        default=population_data["State"].tolist()
    )

    min_population = st.sidebar.slider(
        "Minimum Population",
        min_value=500000,
        max_value=5000000,
        value=500000,
        step=100000
    )

    filtered_data = population_data[
        (population_data["State"].isin(selected_states))
        &
        (population_data["Population"] >= min_population)
    ]

    st.sidebar.metric(
        "States Displayed",
        len(filtered_data),
    )

    # Load Map
    malaysia_map = load_map()

    # Create Filtered Map
    folium_map = plot_map(
        malaysia_map,
        filtered_data
    )

    # Centered Table
    left, center, right = st.columns([1, 3, 1])

    with center:
        st.subheader("Population Data")

        st.dataframe(
            filtered_data,
            use_container_width=True,
            height=500
        )

    st.markdown("<br>", unsafe_allow_html=True)


    # Centered Map  
    left, center, right = st.columns([1, 3, 1])
    with center:
        st.subheader("Population Distribution")

        folium_static(
            folium_map,
            width=1000,
            height=600
        )


if __name__ == "__main__":
    main()