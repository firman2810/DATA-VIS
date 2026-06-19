import streamlit as st
import pandas as pd

from graphs.mosaic import show as mosaic
from graphs.trellis import show as trellis
from graphs.heatmap import show as heatmap
from graphs.multivariate import show as multivariate
from graphs.parallel import show as parallel
from graphs.grandTour import show as grandtour
from graphs.sunburst import show as sunburst

st.set_page_config(
    page_title="Data Visualization Lab 3",
    layout="wide"
)

df = pd.read_csv("Sample - Superstore.csv", encoding="latin1")
st.title("Data Visualization Lab 3")
st.header("Firman - 22005583")
st.divider()

st.sidebar.title("Select Visualization")

section = st.sidebar.selectbox(
    "Choose a visualization",
    [
        "1. Mosaic Plot",
        "2. Trellis Display",
        "3. Heatmap",
        "4. Multivariate Scatter Plot",
        "5. Parallel Coordinate Plot",
        "6. Grand Tour",
        "7. Sunburst Chart"
    ]
)


if section == "1. Mosaic Plot":
    mosaic(df)

elif section == "2. Trellis Display":
    trellis(df)

elif section == "3. Heatmap":
    heatmap(df)

elif section == "4. Multivariate Scatter Plot":
    multivariate(df)

elif section == "5. Parallel Coordinate Plot":
    parallel(df)

elif section == "6. Grand Tour":
    grandtour(df)

elif section == "7. Sunburst Chart":
    sunburst(df)