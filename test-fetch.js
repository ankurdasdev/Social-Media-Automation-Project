fetch("http://46.62.144.244:8000/docs")
  .then(res => console.log("Status:", res.status))
  .catch(err => console.error("Error:", err));
