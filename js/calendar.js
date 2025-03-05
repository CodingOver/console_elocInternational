function generateCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    
    const monthYearElement = document.getElementById("month-year");
    const daysContainer = document.getElementById("calendar-days");
    
    const options = { month: 'long', year: 'numeric' };
    monthYearElement.textContent = now.toLocaleDateString('en-US', options);
    
    daysContainer.innerHTML = "";
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement("div");
        daysContainer.appendChild(emptyDiv);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day");
        dayDiv.textContent = day;
        if (day === today) {
            dayDiv.classList.add("current-day");
        }
        daysContainer.appendChild(dayDiv);
    }
}

generateCalendar();