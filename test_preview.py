import requests, json
r = requests.post('http://localhost:8000/api/upload/preview', files={'file': open('demo.xlsx','rb')})
d = r.json()
print('Status:', r.status_code)
print('Rows:', d.get('totalRows'))
for m in d.get('mapping', [])[:25]:
    print(f"  {m['source_col'][:30]:30} -> {str(m['mapped_field'])[:25]:25} [{m['confidence']}]")
