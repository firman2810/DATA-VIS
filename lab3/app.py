import streamlit as st
import pandas as pd

from graphs.mosaic import show as mosaic
from graphs.trellis import show as trellis
from graphs.heatmap import show as heatmap
from graphs.multivariate import show as multivariate
from graphs.parallel import show as parallel
from graphs.grandTour import show as grandtour

st.set_page_config(
    page_title="Data Visualization Lab 3",
    layout="wide",
    icon="🌐"
)

df = pd.read_csv("tips.csv")
st.title("Data Visualization Lab 3")
st.header("Firman - 22005583")
st.divider()

st.sidebar.title("Select Visualization")

section = st.sidebar.selectbox(
    "Choose a visualization",
    [
        "2.1 Mosaic Plot",
        "2.2 Trellis Display",
        "2.3 Heatmap",
        "2.4 Multivariate Scatter Plot",
        "2.5 Parallel Coordinate Plot",
        "2.6 Grand Tour"
    ]
)



if section == "2.1 Mosaic Plot":
    mosaic(df)

elif section == "2.2 Trellis Display":
    trellis(df)

elif section == "2.3 Heatmap":
    heatmap(df)

elif section == "2.4 Multivariate Scatter Plot":
    multivariate(df)

elif section == "2.5 Parallel Coordinate Plot":
    parallel(df)

elif section == "2.6 Grand Tour":
    grandtour(df)