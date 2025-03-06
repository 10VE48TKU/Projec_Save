document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("dormitoryTable");
    const ownerID = 4; // 👈 ใช้ค่าจาก sessionStorage ในอนาคต เช่น sessionStorage.getItem("User_ID")

    try {
        // ✅ ดึงข้อมูลจาก API
        const response = await fetch(`http://localhost:3000/api/owner/dormitories/${ownerID}`);
        if (!response.ok) throw new Error("⚠️ ไม่พบข้อมูลหอพัก");

        const data = await response.json();
        tableBody.innerHTML = ""; // ล้างข้อมูลเดิม

        // ✅ ตรวจสอบว่ามีข้อมูลหรือไม่
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="11" style="text-align:center; color:red;">⚠️ ไม่พบข้อมูลหอพัก</td></tr>`;
            return;
        }

        // ✅ วนลูปแสดงข้อมูลหอพัก
        data.forEach(dorm => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${dorm.Dormitory_ID}</td>
                <td>${dorm.Dormitory_Name}</td>
                <td>${dorm.Description}</td>
                <td>${dorm.Contact_Number}</td>
                <td>${dorm.Dormitory_Email}</td>
                <td>${dorm.Dormitory_Type}</td>
                <td>${dorm.Category_Name}</td>
   
                <td>
                    ${dorm.Dormitory_Photo 
                        ? `<img src="http://localhost:3000/uploads/${dorm.Dormitory_Photo}" alt="รูปภาพหอพัก" width="100" style="border-radius: 10px;">`
                        : "ไม่มีรูปภาพ"
                    }
                </td>
                <td><button class="btn edit-btn" onclick="editDormitory(${dorm.Dormitory_ID})">แก้ไข</button></td>
                <td>
                    <button class="btn toggle-status-btn ${dorm.Status === 'enable' ? '' : 'disable'}" 
                        onclick="toggleDormitoryStatus(${dorm.Dormitory_ID}, '${dorm.Status}')">
                        ${dorm.Status === 'enable' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("❌ Error loading dormitories:", error);
        tableBody.innerHTML = `<tr><td colspan="11" style="text-align:center; color:red;">❌ เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
    }
});

// ✅ ฟังก์ชันแก้ไขหอพัก
function editDormitory(id) {
    window.location.href = `edit_dormitory.html?id=${id}`;
}

// ✅ ฟังก์ชันเปลี่ยนสถานะหอพัก
async function toggleDormitoryStatus(id, currentStatus) {
    const newStatus = currentStatus === "enable" ? "disable" : "enable";

    if (confirm(`คุณต้องการเปลี่ยนสถานะหอพักนี้เป็น "${newStatus}" หรือไม่?`)) {
        try {
            const response = await fetch(`http://localhost:3000/api/dormitories/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Status: newStatus })
            });

            if (!response.ok) throw new Error("⚠️ ไม่สามารถเปลี่ยนสถานะได้");

            alert(`✅ สถานะเปลี่ยนเป็น "${newStatus}" สำเร็จ!`);
            location.reload(); // รีโหลดหน้า
        } catch (error) {
            console.error("❌ Error toggling status:", error);
            alert("❌ เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const addButton = document.getElementById("addDormitoryBtn");
    if (addButton) {
        addButton.addEventListener("click", () => {
            window.location.href = "add_edit_dormitory.html";
        });
    }
});