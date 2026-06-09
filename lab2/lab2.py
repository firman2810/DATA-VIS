import streamlit as st
import pandas as pd
import altair as alt


def load_css():
    with open("styles.css") as f:
        st.markdown(
            f"<style>{f.read()}</style>",
            unsafe_allow_html=True
        )

load_css()

st.set_page_config(
    page_title="Data Visualization Lab 2",
    page_icon="📊",
    layout="wide"
)

# Page title
st.title("FIRMAN 22005583")
st.markdown("""
# Data Visualization Lab 

### Exploring Interactive Data Visualizations with Altair

""")

st.divider()

# Sidebar
st.sidebar.title("Lab 2 - Altair Visualizations")
st.sidebar.markdown("Use the menu below to explore each section.")

page = st.sidebar.selectbox(
    "Choose a section",
    [
        "1. Exploratory Graphics",
        "2. Presentation Graphics",
        "3. Linked Highlighting",
        "4. Multivariate Context"
    ]
)

# Sample data
data = {
    'Age': [23, 35, 44, 55, 31, 45, 36, 22, 32, 27, 33, 44],
    'Income': [35000, 88000, 60000, 80000, 37000, 75000, 54000, 29000, 82000, 36000, 61000, 63000],
    'Education': [
        'High School', 'Bachelors', 'Masters', 'PhD',
        'High School', 'Masters', 'Bachelors', 'High School',
        'Bachelors', 'High School', 'Bachelors', 'Masters'
    ],
    'Occupation': [
        'Salesman', 'Doctor', 'Artist', 'Scientist',
        'Teacher', 'Engineer', 'Artist', 'Clerk',
        'Doctor', 'Teacher', 'Engineer', 'Scientist'
    ]
}

df = pd.DataFrame(data)

# =====================================================
# 1. Exploratory Graphics
# =====================================================
if page == "1. Exploratory Graphics":

    st.title("Exploratory Graphics vs Presentation Graphics")
    st.header("Exploratory Graphics: Interactive Scatter Plot")

    scatter_chart = (
        alt.Chart(df)
        .mark_circle(size=100)
        .encode(
            x='Age',
            y='Income',
            color='Education',
            tooltip=['Age', 'Income', 'Education', 'Occupation']
        )
        .interactive()
    )

    st.altair_chart(scatter_chart, use_container_width=True)

    st.write(
        "This scatter plot is an example of exploratory graphics, "
        "where users can zoom, pan, and hover over data points to investigate patterns."
    )

# =====================================================
# 2. Presentation Graphics
# =====================================================
elif page == "2. Presentation Graphics":

    st.title("Exploratory Graphics vs Presentation Graphics")
    st.header("Presentation Graphics: Static Bar Chart")

    bar_chart = (
        alt.Chart(df)
        .mark_bar()
        .encode(
            x='Education',
            y='sum(Income)',
            color='Education'
        )
    )

    st.altair_chart(bar_chart, use_container_width=True)

    st.write(
        "This static bar chart is an example of presentation graphics, "
        "designed to communicate information clearly without interaction."
    )

# =====================================================
# 3. Linked Highlighting
# =====================================================
elif page == "3. Linked Highlighting":

    st.title("Interactive Linked Highlighting for High-Dimensional Data")

    # Shared selection
    highlight = alt.selection_point(
        fields=['Education'],
        on='mouseover',
        nearest=True
    )

    # Scatter plot
    scatter_chart_linked = (
        alt.Chart(df)
        .mark_circle(size=100)
        .encode(
            x='Age',
            y='Income',
            color=alt.condition(
                highlight,
                'Education:N',
                alt.value('lightgray')
            ),
            tooltip=['Age', 'Income', 'Education', 'Occupation']
        )
        .add_params(highlight)
    )

    # Bar chart
    bar_chart_linked = (
        alt.Chart(df)
        .mark_bar()
        .encode(
            x='Education',
            y='sum(Income)',
            color=alt.condition(
                highlight,
                'Education:N',
                alt.value('lightgray')
            )
        )
    )

    linked_charts = scatter_chart_linked | bar_chart_linked

    st.altair_chart(linked_charts, use_container_width=True)

    st.write(
        "Hover over a category to highlight related data across both charts."
    )

# =====================================================
# 4. Multivariate Context
# =====================================================
elif page == "4. Multivariate Context":

    st.header("Finding Appropriate Graphics and Linking Multivariate Context")

    occupation_bar = (
        alt.Chart(df)
        .mark_bar()
        .encode(
            x='Occupation',
            y='count()',
            color='Education',
            tooltip=['Occupation', 'Education']
        )
        .interactive()
    )

    st.altair_chart(occupation_bar, use_container_width=True)

    st.write(
        "This bar chart shows occupation frequencies while preserving "
        "education level as an additional variable through color."
    )