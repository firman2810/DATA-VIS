import seaborn as sns
import matplotlib.pyplot as plt

tips=sns.load_dataset("tips")
tips.to_csv("lab3/tips.csv", index=False)
print("Tips dataset saved to tips.csv")
print(tips.head())

