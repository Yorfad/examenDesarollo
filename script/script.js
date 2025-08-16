//definicion, primero tengo que crear un "json" con los municipios de El Progreso
//luego tengo que consumir la api y usarla para crear mis graficas y tablas
//definir informacion requerida

//Información en común (ambos tienen):

//Identificación

//id, depto_id, municipio_id, nombre, tipo_lugar, total_lugares, capital

//Datos generales

//ext_territorial (extensión en km²)

//pob_total (población total)

//indice_masculinidad

//prom_hijos_mujer

//edad_promedio

//indice_dependencia

//Educación

//anios_prom_estudio

//alfabetismo

//Vivienda y hogares

//viviendas_part (particulares)

//total_hogares

//prom_personas_hogar

//total_jefas_hogar

//Distribución por sexo

//total_sexo_hombre, porc_sexo_hombre

//total_sexo_mujeres, porc_sexo_mujeres

//Distribución urbana/rural

//total_sector_urbano, porc_sector_urbano

//total_sector_rural, porc_sector_rural

//Distribución por edad

//pob_edad_014, porc_edad_014

//pob_edad_1564, porc_edad_1564

//pob_edad_65, porc_edad_65

//Distribución étnica

//pob_pueblo_maya, porc_pueblo_maya

//pob_pueblo_garifuna, porc_pueblo_garifuna

//pob_pueblo_xinca, porc_pueblo_xinca

//pob_pueblo_afrodescendiente, porc_pueblo_afrodescendiente

//pob_pueblo_ladino, porc_pueblo_ladino

//pob_pueblo_extranjero, porc_pueblo_extranjero

//no hay que hacer calculos para lo que quiero, ya todo esta aca

const MUNICIPIOS_EL_PROGRESO = [
  { codigo: 999, nombre: 'Departamento El Progreso (resumen)' },
  { codigo: 201, nombre: 'Guastatoya' },
  { codigo: 202, nombre: 'Morazán' },
  { codigo: 203, nombre: 'San Agustín Acasaguastlán' },
  { codigo: 204, nombre: 'San Cristóbal Acasaguastlán' },
  { codigo: 205, nombre: 'El Jícaro' },
  { codigo: 206, nombre: 'Sansare' },
  { codigo: 207, nombre: 'Sanarate' },
  { codigo: 208, nombre: 'San Antonio La Paz' },
];

  // --- Utilidades
  const fmtNum = (n) => n?.toLocaleString('es-GT') ?? '—'; //format number, si no hay nada muestra '—'
  const fmtPct = (n) => (n ?? 0).toFixed(2) + '%'; //formato de percentaje, seran dos decimales y mostrara '0.00%' si no hay nada
  const tipoLugarTexto = (t) => ({1:'País',2:'Departamento',3:'Municipio'}[t] || '—'); //definimos la estructura pasi -> departamento -> municipio para que el programa sea escalable

  function addKPI(container, label, value, desc='') {
    const tpl = document.getElementById('tplKPI').content.cloneNode(true);
    tpl.querySelector('[data-field="label"]').textContent = label;
    tpl.querySelector('[data-field="value"]').textContent = value;
    tpl.querySelector('[data-field="desc"]').textContent = desc;
    container.appendChild(tpl);
  }

  // Key Performance Indicators (KPI) y filas de tablas, nos sirve para mostrar numeros importantes y datos en tablas
  // viene edl chart.js
  function addRow(tbody, c1, c2, c3='') {
    const tpl = document.getElementById('tplRow').content.cloneNode(true);
    tpl.querySelector('[data-field="col1"]').textContent = c1;
    tpl.querySelector('[data-field="col2"]').textContent = c2;
    tpl.querySelector('[data-field="col3"]').textContent = c3;
    tbody.appendChild(tpl);
  }

  // llenar select de municipios
  const selMuni = document.getElementById('selMuni');
  function cargarMunicipiosElProgreso() {
    selMuni.innerHTML = '';
    for (const m of MUNICIPIOS_EL_PROGRESO) {
      const opt = document.createElement('option');
      opt.value = m.codigo;
      opt.textContent = `${m.codigo} — ${m.nombre}`;
      selMuni.appendChild(opt);
    }
    selMuni.value = '999'; // por defecto, resumen departamental
  }
  cargarMunicipiosElProgreso();

  

  let chartSexo, chartSector, chartEdad;

  function renderCharts(d) {
    for (const ch of [chartSexo, chartSector, chartEdad]) { if (ch) ch.destroy(); }

    chartSexo = new Chart(document.getElementById('chartSexo'), {
      type: 'doughnut',
      data: { labels: ['Hombres','Mujeres'], datasets:[{ data: [d.porc_sexo_hombre, d.porc_sexo_mujeres] }] },
      options: { plugins:{ legend:{ labels:{ color:'#2e343bff' }}}}
    });

    chartSector = new Chart(document.getElementById('chartSector'), {
      type: 'doughnut',
      data: { labels: ['Urbano','Rural'], datasets:[{ data: [d.porc_sector_urbano, d.porc_sector_rural] }] },
      options: { plugins:{ legend:{ labels:{ color:'#2e343bff' }}}}
    });

    chartEdad = new Chart(document.getElementById('chartEdad'), {
      type: 'doughnut',
      data: { labels: ['0–14','15–64','65+'], datasets:[{ data: [d.porc_edad_014, d.porc_edad_1564, d.porc_edad_65] }] },
      options: { plugins:{ legend:{ labels:{ color:'#2e343bff' }}}}
    });
  }

//reder charts, aca definimos que graficas camos a mostrar con que dTOA

  function addKPI(container, label, value, desc='') {
    const tpl = document.getElementById('tplKPI').content.cloneNode(true);
    tpl.querySelector('[data-field="label"]').textContent = label;
    tpl.querySelector('[data-field="value"]').textContent = value;
    tpl.querySelector('[data-field="desc"]').textContent = desc;
    container.appendChild(tpl);
  }
  function addRow(tbody, c1, c2, c3='') {
    const tpl = document.getElementById('tplRow').content.cloneNode(true);
    tpl.querySelector('[data-field="col1"]').textContent = c1;
    tpl.querySelector('[data-field="col2"]').textContent = c2;
    tpl.querySelector('[data-field="col3"]').textContent = c3;
    tbody.appendChild(tpl);
  }

  async function cargarDatos() {
    const depto = document.getElementById('selDepto').value;
    const muni  = document.getElementById('selMuni').value;
    const url   = `https://censopoblacion.azurewebsites.net/API/indicadores/${depto}/${muni}`;

    console.log('Cargando datos desde:', url);

    try {
      const r = await fetch(url);
      const raw = await r.text();

      // la api viene mal construida, parece estar doble indexada, por lo que con esta
      // linea tratamos de arreglarlo, si no se puede, mostramos el error
      let data;
      try { data = JSON.parse(raw); } catch { data = raw; }
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) {
          console.error('No se pudo parsear el JSON interno:', e, data);
          throw new Error('Respuesta no parseable');
        }
      }

      console.log('Tipo de data:', typeof data, 'keys:', Object.keys(data));
      console.log('Ejemplos:', { nombre: data.nombre, capital: data.capital, depto_id: data.depto_id, municipio_id: data.municipio_id });

      // --- Header ---
      document.getElementById('tituloLugar').textContent = data.nombre ?? '—';
      document.getElementById('capitalLugar').textContent = data.capital ? `Capital: ${data.capital}` : '—';
      document.getElementById('idsLugar').textContent = `Depto ID: ${data.depto_id} • Municipio ID: ${data.municipio_id}`;
      document.getElementById('badgeTipo').textContent = tipoLugarTexto(data.tipo_lugar);

      // --- KPIs ---
      const kpi = document.getElementById('kpiContainer');
      kpi.innerHTML = '';
      const dens = (Number(data.ext_territorial) && Number(data.pob_total))
        ? Number(data.pob_total) / Number(data.ext_territorial)
        : null;

      addKPI(kpi,'Población total', fmtNum(Number(data.pob_total) || 0));
      addKPI(kpi,'Extensión (km²)', fmtNum(Number(data.ext_territorial) || 0));
      addKPI(kpi,'Densidad (hab/km²)', dens ? dens.toFixed(1) : '—');
      addKPI(kpi,'Edad promedio', (Number(data.edad_promedio) || 0).toFixed(2));
      addKPI(kpi,'Índice de dependencia', (Number(data.indice_dependencia) || 0).toFixed(2), 'dependientes/activos');
      addKPI(kpi,'Índice de masculinidad', (Number(data.indice_masculinidad) || 0).toFixed(2), 'hombres por 100 mujeres');
      addKPI(kpi,'Años prom. estudio', (Number(data.anios_prom_estudio) || 0).toFixed(2));
      addKPI(kpi,'Alfabetismo', fmtPct(Number(data.alfabetismo) || 0));
      addKPI(kpi,'Viviendas particulares', fmtNum(Number(data.viviendas_part) || 0));
      addKPI(kpi,'Total hogares', fmtNum(Number(data.total_hogares) || 0));
      addKPI(kpi,'Personas por hogar', (Number(data.prom_personas_hogar) || 0).toFixed(2));
      addKPI(kpi,'Hogares con jefa (%)', (Number(data.total_jefas_hogar) || 0).toFixed(2) + '%');

      // --- Tablas ---
      const tblEdu = document.getElementById('tblEducacion'); tblEdu.innerHTML = '';
      addRow(tblEdu,'Años promedio de estudio',(Number(data.anios_prom_estudio) || 0).toFixed(2));
      addRow(tblEdu,'Alfabetismo', fmtPct(Number(data.alfabetismo) || 0));

      const tblHog = document.getElementById('tblHogares'); tblHog.innerHTML = '';
      addRow(tblHog,'Viviendas particulares', fmtNum(Number(data.viviendas_part) || 0));
      addRow(tblHog,'Total de hogares', fmtNum(Number(data.total_hogares) || 0));
      addRow(tblHog,'Prom. personas por hogar', (Number(data.prom_personas_hogar) || 0).toFixed(2));
      addRow(tblHog,'Jefas de hogar', (Number(data.total_jefas_hogar) || 0).toFixed(2) + '%');

      const tblEt = document.getElementById('tblEtnia'); tblEt.innerHTML = '';
      [
        ['Maya', data.pob_pueblo_maya, data.porc_pueblo_maya],
        ['Garífuna', data.pob_pueblo_garifuna, data.porc_pueblo_garifuna],
        ['Xinca', data.pob_pueblo_xinca, data.porc_pueblo_xinca],
        ['Afrodescendiente', data.pob_pueblo_afrodescendiente, data.porc_pueblo_afrodescendiente],
        ['Ladino', data.pob_pueblo_ladino, data.porc_pueblo_ladino],
        ['Extranjero', data.pob_pueblo_extranjero, data.porc_pueblo_extranjero],
      ].forEach(([p, pob, pct]) => addRow(
        tblEt,
        p,
        fmtNum(Number(pob) || 0),
        fmtPct(Number(pct) || 0)
      ));

      // --- Gráficas ---
      renderCharts({
        porc_sexo_hombre: Number(data.porc_sexo_hombre) || 0,
        porc_sexo_mujeres: Number(data.porc_sexo_mujeres) || 0,
        porc_sector_urbano: Number(data.porc_sector_urbano) || 0,
        porc_sector_rural: Number(data.porc_sector_rural) || 0,
        porc_edad_014: Number(data.porc_edad_014) || 0,
        porc_edad_1564: Number(data.porc_edad_1564) || 0,
        porc_edad_65: Number(data.porc_edad_65) || 0,
      });

    } catch (e) {
      console.error(e);
      alert('Error al cargar datos. Revisa la consola.');
    }
  }

  document.getElementById('btnCargar').addEventListener('click', cargarDatos);
  // Carga inicial
  cargarDatos();