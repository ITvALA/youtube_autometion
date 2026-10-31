import requests

url = "https://api.github.com/repos/ITvALA/youtube_autometion/actions/runs?per_page=6"
headers = {"Accept": "application/vnd.github.v3+json"}
r = requests.get(url, headers=headers)
if r.ok:
    runs = r.json().get("workflow_runs", [])
    for run in runs:
        print(f"Workflow: {run['name']} | Event: {run['event']} | Status: {run['status']} | Conclusion: {run['conclusion']} | Started: {run['created_at']}")
else:
    print("Failed:", r.status_code, r.text[:200])

