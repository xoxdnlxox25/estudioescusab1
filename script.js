const API_URL = 'https://script.google.com/macros/s/AKfycbxbDKjQn51qF-Tc8j8uaplSctI1UT9Wzfo-PEDwnk8Y0YEI2RrS2F7hyyjT4g2PcL1KGQ/exec';

function login() {
  const username = document.getElementById('username').value;
  if (username.trim() !== '') {
    localStorage.setItem('sabadoUser', username);
    showWelcome(username);
  }
}

function showWelcome(user) {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('welcome-container').style.display = 'block';
  document.getElementById('welcome-message').textContent = `¡Bienvenido, ${user}!`;
}

function logout() {
  localStorage.removeItem('sabadoUser');
  document.getElementById('login-container').style.display = 'block';
  document.getElementById('welcome-container').style.display = 'none';
  document.getElementById('study-container').style.display = 'none';
}

function goToStudy() {
  document.getElementById('welcome-container').style.display = 'none';
  document.getElementById('study-container').style.display = 'block';
  generarBotonesPorDia();
  document.querySelector('.study-card').innerHTML = '<p>Selecciona un día para comenzar el estudio.</p>';
}

function backToWelcome() {
  document.getElementById('study-container').style.display = 'none';
  document.getElementById('welcome-container').style.display = 'block';
}

function markAsStudied() {
  alert("¡Estudio marcado como completado!");
}

function toggleVisibility(id) {
  const el = document.getElementById(id);
  el.style.display = (el.style.display === 'none') ? 'block' : 'none';
}

function guardarNota(id) {
  const contenido = document.getElementById(id).value;
  localStorage.setItem(id, contenido);
}

function guardarRespuesta(id, valor) {
  localStorage.setItem(id, valor);
  verificarRespuesta(id, valor);
}

function verificarRespuesta(id, valor) {
  const resultadoEl = document.getElementById(`resultado_${id}`);
  const correcta = resultadoEl.dataset.correcta;
  if (!correcta) return;

  if (valor === correcta) {
    resultadoEl.textContent = "✔ Correcto";
    resultadoEl.style.color = "green";
  } else {
    resultadoEl.textContent = "✖ Incorrecto";
    resultadoEl.style.color = "red";
  }
}

function generarBotonesPorDia() {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const contenedor = document.getElementById("semana-estudios");
  contenedor.innerHTML = "";

  const hoy = new Date();
  const diaActualTexto = dias[hoy.getDay() % 7];

  dias.forEach(diaTexto => {
    const btn = document.createElement("button");
    btn.className = `dia-btn${diaTexto === diaActualTexto ? " dia-actual" : ""}`;
    btn.textContent = diaTexto;
    btn.onclick = () => cargarEstudioPorDia(diaTexto);
    contenedor.appendChild(btn);
  });
}

function cargarEstudioPorDia(dia) {
  const urlConDia = `${API_URL}?dia=${dia}`;

  fetch(urlConDia)
    .then(res => res.json())
    .then(data => {
      const card = document.querySelector('.study-card');
      if (!data || data.error) {
        card.innerHTML = `<p>${data.error || "No se encontró ningún estudio disponible."}</p>`;
        return;
      }

      let contenidoHTML = `<h2>Estudio para el día ${dia}</h2>`;

      data.preguntas.forEach((item, index) => {
        const respuestas = (item.Respuesta || "")
          .split('<br>')
          .map(r => r.trim())
          .filter(r => r.length > 0)
          .slice(0, 3);

        const notaId = `notaPersonal_${dia}_${index}`;
        const respuestaId = `respuesta_${dia}_${index}`;
        const notaGuardada = localStorage.getItem(notaId) || "";
        const respuestaGuardada = localStorage.getItem(respuestaId) || "";

        contenidoHTML += `<div class="bloque-pregunta">`;

        // ✅ Aquí se aplica el salto de línea para subtítulos
        if (item.Título) contenidoHTML += `<p><strong>${item.Título.replace(/\n/g, "<br>")}</strong></p>`;
        if (item.Pregunta) contenidoHTML += `<p><strong>${item.Pregunta}</strong></p>`;

        if (item.Versiculo) {
          contenidoHTML += `
            <button class="btn-mini" onclick="toggleVisibility('versiculo${index}')">Mostrar/Ocultar versículo</button>
            <div id="versiculo${index}" style="display: none; margin-top: 10px;">
              <p><strong>Versículos:</strong><br>${item.Versiculo}</p>
            </div>`;
        }

        if (item.Nota) {
          contenidoHTML += `
            <button class="btn-mini" onclick="toggleVisibility('nota${index}')">Mostrar/Ocultar nota</button>
            <div id="nota${index}" style="display: none; margin-top: 10px;">
              <p><strong>Nota:</strong><br>${item.Nota}</p>
            </div>`;
        }

        if (respuestas.length > 0) {
          contenidoHTML += `
            <button class="btn-mini" onclick="toggleVisibility('respuesta${index}')">Mostrar/Ocultar respuestas</button>
            <div class="respuesta" id="respuesta${index}" style="display: none; margin-top: 10px;">
              <p><strong>Respuesta:</strong></p>
              ${respuestas.map(r => {
                const letra = r.charAt(0);
                const checked = respuestaGuardada === letra ? 'checked' : '';
                return `<label><input type="radio" name="respuesta${index}" value="${letra}" ${checked} onclick="guardarRespuesta('${respuestaId}', '${letra}')"> ${r}</label>`;
              }).join('<br>')}
              <p id="resultado_${respuestaId}" data-correcta="${item.Correcta || ''}" style="margin-top:8px;"></p>
            </div>`;
        }

        contenidoHTML += `
          <div class="nota-personal" style="margin-top: 15px;">
            <label><strong>✍️ Mis notas personales:</strong></label><br>
            <textarea id="${notaId}" oninput="guardarNota('${notaId}')" placeholder="Escribe aquí tu reflexión...">${notaGuardada}</textarea>
          </div>
          <hr style="margin: 25px 0; border: none; border-top: 1px solid #ccc;">
        </div>`;
      });

      contenidoHTML += `<button class="btn btn-study" onclick="markAsStudied()">Marcar como estudiado</button>`;
      card.innerHTML = contenidoHTML;

      data.preguntas.forEach((item, index) => {
        const respuestaId = `respuesta_${dia}_${index}`;
        const valor = localStorage.getItem(respuestaId);
        if (valor) verificarRespuesta(respuestaId, valor);
      });
    })
    .catch(err => {
      document.querySelector('.study-card').innerHTML = '<p>Error al cargar el estudio.</p>';
      console.error('Error al obtener estudio:', err);
    });
}

window.onload = function () {
  const savedUser = localStorage.getItem('sabadoUser');
  if (savedUser) {
    showWelcome(savedUser);
  }
};
