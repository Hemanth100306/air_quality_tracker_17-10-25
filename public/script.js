async function loadData() {
  try {
    const res = await fetch("/api/latest");
    const data = await res.json();
    const tbody = document.querySelector("#aq-table tbody");
    tbody.innerHTML = "";
    if(!data.ok||!data.results){ document.getElementById("status").innerText="No data"; return; }
    data.results.forEach(r=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${r.location}<div class="small">${r.city}, ${r.country}</div></td>
      <td>${r.parameter}</td>
      <td>${r.value!==null?r.value:"-"}</td>
      <td>${r.unit||""}</td>
      <td>${r.lastUpdated?new Date(r.lastUpdated).toLocaleString():"-"}</td>`;
      tbody.appendChild(tr);
    });
    document.getElementById("status").innerText=`Last refresh: ${new Date().toLocaleTimeString()}`;
  } catch { document.getElementById("status").innerText="Error"; }
}
loadData(); setInterval(loadData,20000);
