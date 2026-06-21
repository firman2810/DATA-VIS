import streamlit as st
import geopandas as gpd
import pandas as pd
import numpy as np
import folium
from streamlit_folium import folium_static

# --------------------------------------------------
# Page Configuration
# --------------------------------------------------
st.set_page_config(
    page_title="Data Visualization Lab 4",
    layout="wide"
)

# --------------------------------------------------
# Generate Population Data
# --------------------------------------------------
def generate_population_data():
    states = [
        "Johor",
        "Kedah",
        "Kelantan",
        "Melaka",
        "Negeri Sembilan",
        "Pahang",
        "Penang",
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


# --------------------------------------------------
# Load Malaysia Map
# --------------------------------------------------
@st.cache_data
def load_map():
    return gpd.read_file("malaysia_states.json")


# --------------------------------------------------
# Create Choropleth Map
# --------------------------------------------------
def plot_map(malaysia_map, data):

    m = folium.Map(
        location=[4.2105, 101.9758],
        zoom_start=6
    )

    folium.Choropleth(
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

    return m


# --------------------------------------------------
# Main App
# --------------------------------------------------
def main():

    # Centered Title
    st.markdown(
        """
        <h1 style='text-align:center;'>
            Malaysia Population Distribution Map
        </h1>
        """,
        unsafe_allow_html=True
    )

    population_data = generate_population_data()
    malaysia_map = load_map()
    folium_map = plot_map(malaysia_map, population_data)

    # -------------------------------
    # Centered Population Table
    # -------------------------------
    left, center, right = st.columns([1, 3, 1])

    with center:
        st.subheader("Population Data")
        st.dataframe(
            population_data,
            use_container_width=True,
            height=500
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # -------------------------------
    # Centered Map
    # -------------------------------
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