document.addEventListener("DOMContentLoaded", async () => {
    await loadPendingDormitories();
});

async function loadPendingDormitories() {
    try {
        const res = await fetch("http://localhost:3000/api/pending_dormitories");
        const data = await res.json();

        const tableBody = document.getElementById("pendingDormsList");
        tableBody.innerHTML = "";

        data.forEach(dorm => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${dorm.Dormitory_Name}</td>
                <td>${dorm.Description}</td>
                <td>${dorm.Contact_Number}</td>
                <td>${dorm.Dormitory_Email}</td>
                <td>
                    <button onclick="approveDormitory(${dorm.Pending_ID})">✅ ยืนยัน</button>
                    <button onclick="confirmReject(${dorm.Pending_ID})">❌ ยกเลิก</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("❌ Error loading pending dormitories:", error);
    }
}

async function approveDormitory(id) {
    if (confirm("ยืนยันการอนุมัติหอพักนี้หรือไม่?")) {
        try {
            const res = await fetch(`http://localhost:3000/api/approve_dormitory/${id}`, { method: "POST" });

            if (!res.ok) throw new Error("❌ ไม่สามารถอนุมัติหอพักได้");
            alert("✅ หอพักได้รับการยืนยันแล้ว!");
            await loadPendingDormitories();
        } catch (error) {
            console.error(error);
        }
    }
}

async function confirmReject(id) {
    if (confirm("⚠️ คุณต้องการยกเลิกหอพักนี้หรือไม่? ข้อมูลจะถูกลบอย่างถาวร!")) {
        try {
            const res = await fetch(`http://localhost:3000/api/reject_dormitory/${id}`, { method: "DELETE" });

            if (!res.ok) throw new Error("❌ ไม่สามารถลบหอพักได้");
            alert("❌ หอพักถูกลบออกจากระบบเรียบร้อยแล้ว");
            await loadPendingDormitories();
        } catch (error) {
            console.error(error);
        }
    }
}
