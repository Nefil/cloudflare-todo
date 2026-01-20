const API_URL = "https://backend.cloudflare-todo.workers.dev";

const input = document.getElementById("todo-input");
const button = document.getElementById("add-btn");
const list = document.getElementById("todo-list");

function pill(text, variant) {
  const span = document.createElement("span");
  span.className = `pill pill-${variant}`;
  span.textContent = text;
  return span;
}

function actionButton(label, variant, onClick) {
  const btn = document.createElement("button");
  btn.className = `btn btn-${variant}`;
  btn.textContent = label;
  btn.onclick = async () => {
    btn.disabled = true;
    await onClick();
    btn.disabled = false;
  };
  return btn;
}

async function loadTodos() {
  list.innerHTML = '<li class="muted">Ładowanie…</li>';
  try {
    const res = await fetch(`${API_URL}/todos`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const todos = await res.json();

    list.innerHTML = "";
    if (!todos.length) {
      list.innerHTML = '<li class="muted">Brak zadań — dodaj pierwsze.</li>';
      return;
    }

    todos.forEach(todo => {
      const li = document.createElement("li");
      li.className = "todo-item";
      if (todo.is_deleted) li.classList.add("faded");
      if (todo.is_completed) li.classList.add("done");

      const left = document.createElement("div");
      left.className = "todo-left";

      const title = document.createElement("span");
      title.className = "todo-title";
      title.textContent = todo.title;
      left.appendChild(title);

      const badges = document.createElement("div");
      badges.className = "badges";
      if (todo.is_completed) badges.appendChild(pill("Gotowe", "success"));
      if (todo.is_deleted) badges.appendChild(pill("Do usunięcia", "warning"));
      left.appendChild(badges);

      const actions = document.createElement("div");
      actions.className = "actions";
      actions.appendChild(
        actionButton(
          todo.is_completed ? "Cofnij gotowe" : "Oznacz jako gotowe",
          todo.is_completed ? "ghost" : "primary",
          () => markCompleted(todo.id)
        )
      );
      actions.appendChild(
        actionButton(
          todo.is_deleted ? "Cofnij usunięcie" : "Do usunięcia",
          todo.is_deleted ? "ghost" : "danger",
          () => markDeleted(todo.id)
        )
      );
      actions.appendChild(
        actionButton(
          "Usuń",
          "danger",
          () => deleteTodo(todo.id)
        )
      );

      li.appendChild(left);
      li.appendChild(actions);
      list.appendChild(li);
    });
  } catch (err) {
    list.innerHTML = `<li class="error">Błąd ładowania: ${err.message}</li>`;
  }
}

async function addTodo() {
  const title = input.value.trim();
  if (!title) return;

  button.disabled = true;
  button.textContent = "Dodaję…";
  try {
    const res = await fetch(`${API_URL}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    input.value = "";
    await loadTodos();
  } catch (err) {
    alert(`Nie udało się dodać: ${err.message}`);
  } finally {
    button.disabled = false;
    button.textContent = "Dodaj";
  }
}

async function markCompleted(id) {
  await fetch(`${API_URL}/todos/${id}/complete`, { method: "PATCH" });
  loadTodos();
}

async function markDeleted(id) {
  await fetch(`${API_URL}/todos/${id}/delete`, { method: "PATCH" });
  loadTodos();
}

async function deleteTodo(id) {
  if (!confirm("Na pewno usunąć to zadanie? Tej operacji nie można cofnąć.")) return;
  await fetch(`${API_URL}/todos/${id}`, { method: "DELETE" });
  loadTodos();
}

button.addEventListener("click", addTodo);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") addTodo();
});

loadTodos();