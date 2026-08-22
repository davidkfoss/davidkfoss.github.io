(() => {
  const boot = document.getElementById("boot");
  const bootButton = document.getElementById("boot-button");
  const desktop = document.getElementById("desktop");
  const startButton = document.getElementById("start-button");
  const startMenu = document.getElementById("start-menu");
  const taskButtons = document.getElementById("task-buttons");
  const msnToast = document.getElementById("msn-toast");
  const taskClock = document.getElementById("task-clock");

  const windows = [...document.querySelectorAll(".window")];
  let z = 20;
  const state = new Map();

  function updateClock() {
    taskClock.textContent = new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  }
  updateClock();
  setInterval(updateClock, 30000);

  function focusWindow(win) {
    windows.forEach(w => w.classList.remove("active"));
    win.classList.add("active");
    win.style.zIndex = ++z;
    updateTaskbar();
  }

  function openWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.classList.add("open");
    win.classList.remove("minimized");
    focusWindow(win);
    startMenu.classList.remove("open");
    startMenu.setAttribute("aria-hidden","true");
    updateTaskbar();
    if (id === "terminal") setTimeout(() => document.getElementById("cmd-input").focus(), 30);
  }

  function closeWindow(win) {
    win.classList.remove("open","active","maximized","minimized");

    // Stop Winamp music when closing the window
    if (win.id === "winamp" && typeof audio !== "undefined") {
      audio.pause();
      audio.currentTime = 0;
    }

    updateTaskbar();
  }

  function minimizeWindow(win) {
    win.classList.add("minimized");
    win.classList.remove("active");
    updateTaskbar();
  }

  function maximizeWindow(win) {
    win.classList.toggle("maximized");
    focusWindow(win);
  }

  function updateTaskbar() {
    taskButtons.innerHTML = "";
    windows.filter(w => w.classList.contains("open")).forEach(win => {
      const b = document.createElement("button");
      b.className = "task-button" + (win.classList.contains("active") && !win.classList.contains("minimized") ? " active" : "");
      b.textContent = win.dataset.title || win.id;
      b.type = "button";
      b.addEventListener("click", () => {
        if (win.classList.contains("minimized")) {
          win.classList.remove("minimized");
          focusWindow(win);
        } else if (win.classList.contains("active")) {
          minimizeWindow(win);
        } else {
          focusWindow(win);
        }
      });
      taskButtons.appendChild(b);
    });
  }

  document.querySelectorAll("[data-open]").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      openWindow(el.dataset.open);
    });
  });

  windows.forEach(win => {
    win.addEventListener("mousedown", () => focusWindow(win));

    const close = win.querySelector("[data-close]");
    const min = win.querySelector("[data-minimize]");
    const max = win.querySelector("[data-maximize]");
    close?.addEventListener("click", e => { e.stopPropagation(); closeWindow(win); });
    min?.addEventListener("click", e => { e.stopPropagation(); minimizeWindow(win); });
    max?.addEventListener("click", e => { e.stopPropagation(); maximizeWindow(win); });
  });

  // Drag windows
  document.querySelectorAll(".drag-handle").forEach(handle => {
    let drag = null;
    handle.addEventListener("pointerdown", e => {
      if (e.target.closest("button")) return;
      const win = handle.closest(".window");
      if (!win || win.classList.contains("maximized")) return;
      focusWindow(win);
      const rect = win.getBoundingClientRect();
      drag = {win, dx:e.clientX-rect.left, dy:e.clientY-rect.top};
      handle.setPointerCapture?.(e.pointerId);
    });
    handle.addEventListener("pointermove", e => {
      if (!drag) return;
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - 80;
      drag.win.style.left = Math.max(-drag.win.offsetWidth+80, Math.min(maxX, e.clientX-drag.dx)) + "px";
      drag.win.style.top = Math.max(0, Math.min(maxY, e.clientY-drag.dy)) + "px";
    });
    handle.addEventListener("pointerup", () => drag = null);
    handle.addEventListener("pointercancel", () => drag = null);
  });

  startButton.addEventListener("click", e => {
    e.stopPropagation();
    const open = startMenu.classList.toggle("open");
    startMenu.setAttribute("aria-hidden", String(!open));
  });

  document.addEventListener("click", e => {
    if (!startMenu.contains(e.target) && e.target !== startButton) {
      startMenu.classList.remove("open");
      startMenu.setAttribute("aria-hidden","true");
    }
  });

  bootButton.addEventListener("click", () => {
    boot.classList.add("hidden");
    setTimeout(() => msnToast.classList.add("show"), 900);
    setTimeout(() => msnToast.classList.remove("show"), 5000);
  });

  document.getElementById("logoff").addEventListener("click", () => {
    startMenu.classList.remove("open");
    windows.forEach(closeWindow);
    boot.classList.remove("hidden");
  });

  document.getElementById("shutdown").addEventListener("click", () => {
    startMenu.classList.remove("open");
    boot.classList.remove("hidden");
    boot.querySelector(".boot-name").textContent = "It is now safe to turn off your computer.";
    bootButton.textContent = "restart";
  });

  // Command prompt
  const cmdOut = document.getElementById("cmd-output");
  const cmdHistory = document.getElementById("cmd-history");
  const cmdTyped = document.getElementById("cmd-typed");
  const cmdInput = document.getElementById("cmd-input");
  let buffer = "";
  const prompt = "C:\\Documents and Settings\\David>";

  function syncTyped() {
    cmdTyped.textContent = buffer;
    cmdOut.scrollTop = cmdOut.scrollHeight;
  }

  function appendHistory(text = "") {
    cmdHistory.textContent += text;
    cmdOut.scrollTop = cmdOut.scrollHeight;
  }

  function runCommand(raw) {
    const command = raw.trim().toLowerCase();
    appendHistory(prompt + raw + "\n");

    if (!command) {
      // blank command
    } else if (command === "help") {
      appendHistory(
        "ABOUT      show profile\n" +
        "WORK       show work history\n" +
        "RESEARCH   show publication info\n" +
        "STACK      show tools\n" +
        "DIR        list files\n" +
        "CLS        clear screen\n" +
        "EXIT       close terminal\n"
      );
    } else if (command === "about") {
      appendHistory("David Foss — MSc CS/AI, NTNU. AI research and ML engineering.\n");
    } else if (command === "work") {
      appendHistory(
        "2026      Cognite — AI Research Intern\n" +
        "2025-26   Norges Bank — ML Engineer / Data Engineer\n" +
        "2024      ReLU NTNU — Data Scientist\n" +
        "2024      Sticos — Software Developer Intern\n" +
        "2023      MyWorkout — Software Developer Intern\n"
      );
    } else if (command === "research") {
      appendHistory(
        "ICONIP 2026 — Isolating Feedback Utility in Adaptive Optimizer Scheduling\n" +
        "PDF: coming soon\n"
      );
    } else if (command === "stack") {
      appendHistory("Python  PyTorch  Databricks  MLflow  Spark  SQL  Docker  GitHub Actions\n");
    } else if (command === "dir") {
      appendHistory("ABOUT.TXT\nWORK\\\nRESEARCH\\\nSTACK.INI\nICONIP_2026.PDF\n");
    } else if (command === "cls") {
      cmdHistory.textContent = "";
    } else if (command === "exit") {
      buffer = "";
      syncTyped();
      closeWindow(document.getElementById("terminal"));
      return;
    } else {
      appendHistory("'" + raw + "' is not recognized as an internal or external command.\n");
    }

    if (command !== "cls") appendHistory("\n");
    buffer = "";
    cmdInput.value = "";
    syncTyped();
  }

  document.getElementById("terminal").addEventListener("click", () => cmdInput.focus());

  cmdInput.addEventListener("input", () => {
    buffer = cmdInput.value;
    syncTyped();
  });

  cmdInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      runCommand(buffer);
    }
  });

  // Winamp easter egg
  // Winamp player
  const tracks = [
    {
      title: "01. TIME SERIES FM",
      src: "music/song2.mp3"
    },
    {
      title: "02. OPEN LOOP CONTROL",
      src: "music/song1.mp3"
    },
    {
      title: "03. DATABRICKS NIGHTS",
      src: "music/song3.mp3"
    },
    {
      title: "04. MELBOURNE 2026",
      src: "music/song4.mp3"
    }
  ];

  let trackIndex = 0;

  const audio = new Audio();

  const trackTitle = document.getElementById("track-title");
  const trackTime = document.getElementById("track-time");

  const trackButtons = [
    ...document.querySelectorAll(".track")
  ];


  function loadTrack(index) {
    trackIndex = index;

    audio.src = tracks[index].src;

    trackTitle.textContent = tracks[index].title;

    trackButtons.forEach((b, i) =>
      b.classList.toggle(
        "selected",
        i === index
      )
    );
  }


  function play() {
    audio.play();
  }


  function pause() {
    audio.pause();
  }


  audio.addEventListener("timeupdate", () => {
    const mins = Math.floor(audio.currentTime / 60);
    const secs = Math.floor(audio.currentTime % 60);

    trackTime.textContent =
      `${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
  });


  document
    .querySelector("[data-play]")
    .addEventListener("click", play);


  document
    .querySelector("[data-pause]")
    .addEventListener("click", pause);


  document
    .querySelector("[data-next]")
    .addEventListener("click", () => {
      loadTrack(
        (trackIndex + 1) % tracks.length
      );
      play();
    });


  document
    .querySelector("[data-prev]")
    .addEventListener("click", () => {
      loadTrack(
        (trackIndex - 1 + tracks.length) % tracks.length
      );
      play();
    });


  trackButtons.forEach((button, i) => {
    button.addEventListener(
      "click",
      () => {
        loadTrack(i);
        play();
      }
    );
  });


  loadTrack(0);

  // Double-click desktop shortcuts feels more authentic, but keep single-click usable.
  document.querySelectorAll(".desktop-icon").forEach(icon => {
    icon.addEventListener("dblclick", () => openWindow(icon.dataset.open));
  });

  updateTaskbar();
})();

// XP MINESWEEPER
(() => {
  const board = document.getElementById("mine-board");
  if (!board) return;

  const counter = document.getElementById("mine-counter");

  const size = 10;
  const mineTotal = 15;

  let cells = [];
  let buttons = [];
  let gameOver = false;
  const resetButton = document.getElementById("mine-reset");

  const directions = [
    [-1,-1],[0,-1],[1,-1],
    [-1,0],[1,0],
    [-1,1],[0,1],[1,1]
  ];

  function updateCounter() {
    if (!counter) return;

    const flags = cells.filter(c => c.flagged).length;
    const remaining = mineTotal - flags;

    counter.textContent =
      `Mines: ${String(remaining).padStart(3, "0")}`;
  }


  function start() {
    resetButton.textContent = "🙂";
    board.innerHTML = "";

    cells = [];
    buttons = [];
    gameOver = false;


    cells = Array.from(
      { length: size * size },
      () => ({
        mine: false,
        opened: false,
        flagged: false,
        count: 0
      })
    );


    let placed = 0;

    while (placed < mineTotal) {
      const i = Math.floor(Math.random() * cells.length);

      if (!cells[i].mine) {
        cells[i].mine = true;
        placed++;
      }
    }


    cells.forEach((cell, i) => {
      const x = i % size;
      const y = Math.floor(i / size);

      cell.count = directions
        .map(([dx, dy]) => [x + dx, y + dy])
        .filter(([nx, ny]) =>
          nx >= 0 &&
          ny >= 0 &&
          nx < size &&
          ny < size
        )
        .map(([nx, ny]) => ny * size + nx)
        .filter(index => cells[index].mine)
        .length;
    });


    cells.forEach((cell, i) => {
      const button = document.createElement("button");

      button.className = "mine-cell";


      button.addEventListener("click", () => {
        reveal(i);
      });


      button.addEventListener("contextmenu", e => {
        e.preventDefault();

        if (gameOver || cell.opened) return;


        cell.flagged = !cell.flagged;

        button.textContent =
          cell.flagged ? "⚑" : "";

        button.classList.toggle(
          "flag",
          cell.flagged
        );

        updateCounter();
        checkWin();
      });


      buttons.push(button);
      board.appendChild(button);
    });


    updateCounter();
  }


  function reveal(i) {
    const cell = cells[i];

    if (
      gameOver ||
      cell.opened ||
      cell.flagged
    ) return;


    cell.opened = true;

    const button = buttons[i];

    button.classList.add("open");


    if (cell.mine) {

      button.textContent = "💣";
      button.classList.add("mine");

      resetButton.textContent = "😵";

      gameOver = true;


      cells.forEach((c, index) => {

        if (c.mine) {
          buttons[index].textContent = "💣";
          buttons[index].classList.add("mine");
        }

      });


      return;
    }


    if (cell.count > 0) {

      button.textContent = cell.count;
      checkWin();
      
      return;
    }


    const x = i % size;
    const y = Math.floor(i / size);


    directions.forEach(([dx, dy]) => {

      const nx = x + dx;
      const ny = y + dy;


      if (
        nx >= 0 &&
        ny >= 0 &&
        nx < size &&
        ny < size
      ) {
        reveal(
          ny * size + nx
        );
      }

    });


    checkWin();
  }



  function checkWin() {
    const cleared = cells.every(
      cell => cell.mine || cell.opened
    );

    if (!cleared) return;

    gameOver = true;

    cells.forEach((cell, i) => {
      if (cell.mine) {
        buttons[i].textContent = "💣";
        buttons[i].classList.add("mine");
      }
    });

    resetButton.textContent = "😎";

    if (counter) {
      counter.textContent = "Mines: 000";
    }
  }



  document
    .getElementById("mine-reset")
    ?.addEventListener(
      "click",
      start
    );


  start();

})();