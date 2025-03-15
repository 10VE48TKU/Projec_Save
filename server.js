const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use('/public', express.static('public'));

// กำหนดตำแหน่งสำหรับจัดเก็บรูปภาพ
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// ✅ เชื่อมต่อฐานข้อมูล MariaDB
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Admin001",
    database: "dormitory_search_system"
});

db.connect(err => {
    if (err) {
        console.error("❌ ไม่สามารถเชื่อมต่อกับฐานข้อมูล:", err.message);
        process.exit(1);
    }
    console.log("✅ เชื่อมต่อกับฐานข้อมูลสำเร็จ!");
});

// ✅ Middleware ตรวจสอบสิทธิ์นักศึกษา (User_Type = 1)
const verifyStudent = (req, res, next) => {
    const userType = req.headers["user_type"];
    if (userType !== "1") {
        return res.status(403).json({ error: "❌ คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }
    next();
};

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use(express.static(path.join(__dirname, "../public/Administrator")));
// app.use(express.static(path.join(__dirname, "../public/DormitoryOwner")));


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/Administrator/dashboard.html"));
});

app.get("/dashboard_data", (req, res) => {
    let typeQuery = "SELECT * FROM dormitory_type";
    let categoryQuery = "SELECT * FROM dormitory_category";
    let facilityQuery = "SELECT * FROM facility";

    Promise.all([
        new Promise((resolve, reject) => {
            db.query(typeQuery, (err, typeData) => {
                if (err) reject(err);
                else resolve(typeData);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(categoryQuery, (err, categoryData) => {
                if (err) reject(err);
                else resolve(categoryData);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(facilityQuery, (err, facilityData) => {
                if (err) reject(err);
                else resolve(facilityData);
            });
        })
    ])
        .then(([types, categories, facilities]) => {
            res.json({ types, categories, facilities });
        })
        .catch(err => {
            console.error("❌ Error fetching data:", err);
            res.status(500).json({ error: "Internal Server Error" });
        });
});

// // ✅ API ดึงประเภทหอพัก
// app.get("/dormitory_types", (req, res) => {
//     db.query("SELECT * FROM dormitory_type", (err, result) => {
//         if (err) {
//             console.error("❌ Error fetching dormitory types:", err);
//             return res.status(500).json({ error: "Database error" });
//         }
//         res.json(result);
//     });
// });

// // ✅ API ดึงหมวดหมู่หอพัก
// app.get("/dormitory_categories", (req, res) => {
//     db.query("SELECT * FROM dormitory_category", (err, result) => {
//         if (err) {
//             console.error("❌ Error fetching dormitory categories:", err);
//             return res.status(500).json({ error: "Database error" });
//         }
//         res.json(result);
//     });
// });

//เพิ่มประเถทหรอพัก
app.post("/api/dormitory_types", (req, res) => {
    const { Dormitory_Type } = req.body;

    if (!Dormitory_Type) {
        return res.status(400).json({ error: "กรุณากรอกชื่อประเภทหอพัก!" });
    }

    const sql = "INSERT INTO dormitory_type (Dormitory_Type) VALUES (?)";
    db.query(sql, [Dormitory_Type], (err, result) => {
        if (err) {
            console.error("❌ Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "✅ เพิ่มประเภทหอพักสำเร็จ!", insertedId: result.insertId });
    });
});

// ✅ API ดึงข้อมูลประเภทหอพัก
app.get("/api/dormitory_types", (req, res) => {
    db.query("SELECT * FROM dormitory_type", (err, results) => {
        if (err) {
            console.error("❌ Error fetching dormitory types:", err);
            return res.status(500).json({ error: "Failed to fetch dormitory types" });
        }
        res.json(results);
    });
});

//เพิ่มหมวดหมู่หอพัก
app.post("/api/dormitory_categories", (req, res) => {
    const { Category_Name } = req.body;

    if (!Category_Name) {
        return res.status(400).json({ error: "กรุณากรอกชื่อหมวดหมู่หอพัก!" });
    }

    const sql = "INSERT INTO dormitory_category (Category_Name) VALUES (?)";
    db.query(sql, [Category_Name], (err, result) => {
        if (err) {
            console.error("❌ Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "✅ เพิ่มหมวดหมู่หอพักสำเร็จ!", insertedId: result.insertId });
    });
});


// ✅ API ดึงข้อมูล Facility ทั้งหมด
app.get("/facilities", (req, res) => {
    db.query("SELECT * FROM facility", (err, result) => {
        if (err) {
            console.error("❌ Error fetching facility data:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(result);
    });
});

// ✅ API ดึงข้อมูล Facility ตาม ID
app.get("/facilities/:id", (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM facility WHERE Facility_ID = ?", [id], (err, result) => {
        if (err || result.length === 0) {
            console.error("❌ Error fetching facility data:", err);
            return res.status(500).json({ error: "Error fetching facility data" });
        }
        res.json(result[0]);
    });
});

// ✅ API เพิ่ม Facility (พร้อมตรวจสอบค่าก่อนบันทึก)
app.post("/add_facility", (req, res) => {
    const { Facility_Name, Status } = req.body;

    if (!Facility_Name) {
        return res.status(400).json({ error: "กรุณากรอกชื่อ Facility!" });
    }

    const sql = "INSERT INTO facility (Facility_Name, Status) VALUES (?, ?)";
    const values = [Facility_Name, Status || "enable"];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("❌ Database error:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json({ message: "✅ Facility added successfully", insertedId: result.insertId });
    });
});

// ✅ API ดึงข้อมูลประเภทหอพักตาม ID
app.get("/dormitory_types/:id", (req, res) => {
    const id = parseInt(req.params.id, 10); // แปลงให้เป็นตัวเลข

    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
    }

    const sql = "SELECT * FROM dormitory_type WHERE Dormitory_Type_ID = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("❌ Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "ไม่พบข้อมูลประเภทหอพัก!" });
        }

        res.json(result[0]);
    });
});

app.put("/update/:id", (req, res) => {
    const { id } = req.params;
    const { Dormitory_Type } = req.body;

    if (!Dormitory_Type) {
        return res.status(400).json({ error: "กรุณากรอกชื่อประเภทหอพัก!" });
    }

    const sql = "UPDATE dormitory_type SET Dormitory_Type = ? WHERE Dormitory_Type_ID = ?";
    db.query(sql, [Dormitory_Type, id], (err, result) => {
        if (err) {
            console.error("❌ Error updating dormitory type:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "ไม่พบข้อมูลที่ต้องการแก้ไข!" });
        }

        res.json({ message: "✅ อัปเดตข้อมูลสำเร็จ!" });
    });
});

// ✅ API ดึงข้อมูลหมวดหมู่หอพักตาม ID
app.get("/dormitory_categories/:id", (req, res) => {
    const id = parseInt(req.params.id, 10); // แปลง ID เป็นตัวเลข

    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
    }

    const sql = "SELECT * FROM dormitory_category WHERE Category_ID = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("❌ Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "ไม่พบข้อมูลหมวดหมู่หอพัก!" });
        }

        res.json(result[0]);
    });
});

// ✅ API ดึงข้อมูลหมวดหมู่หอพัก
app.get("/api/dormitory_categories", (req, res) => {
    db.query("SELECT * FROM dormitory_category", (err, results) => {
        if (err) {
            console.error("❌ Error fetching categories:", err);
            return res.status(500).json({ error: "Failed to fetch dormitory categories" });
        }
        res.json(results);
    });
});

app.put("/update_category/:id", (req, res) => {
    const { id } = req.params;
    const { Category_Name } = req.body;

    if (!Category_Name) {
        return res.status(400).json({ error: "กรุณากรอกชื่อหมวดหมู่หอพัก!" });
    }

    const sql = "UPDATE dormitory_category SET Category_Name = ? WHERE Category_ID = ?";
    const values = [Category_Name, id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("❌ Error updating category:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "ไม่พบข้อมูลที่ต้องการแก้ไข" });
        }

        res.json({ message: "✅ อัปเดตข้อมูลสำเร็จ!" });
    });
});

// ✅ API อัปเดต Facility_Name และ Facility_Description เท่านั้น
app.put("/update_facility/:id", (req, res) => {
    const { id } = req.params;
    const { Facility_Name, Status } = req.body;

    if (!Facility_Name) {
        return res.status(400).json({ error: "กรุณากรอกชื่อ Facility!" });
    }

    const sql = "UPDATE facility SET Facility_Name = ?, Status = ? WHERE Facility_ID = ?";
    const values = [Facility_Name, Status || "enable", id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("❌ Error updating facility:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "ไม่พบข้อมูลที่ต้องการแก้ไข" });
        }

        res.json({ message: "✅ Facility updated successfully" });
    });
});

// ✅ API เปลี่ยนสถานะ Enable/Disable Facility
app.put("/toggle_facility/:id", (req, res) => {
    const { id } = req.params;

    db.query("SELECT Status FROM facility WHERE Facility_ID = ?", [id], (err, result) => {
        if (err || result.length === 0) {
            console.error("❌ Error toggling facility status:", err);
            return res.status(500).json({ error: "Error toggling facility status" });
        }

        const newStatus = result[0].Status === "enable" ? "disable" : "enable";

        db.query("UPDATE facility SET Status = ? WHERE Facility_ID = ?", [newStatus, id], (err) => {
            if (err) {
                console.error("❌ Error updating facility status:", err);
                return res.status(500).json({ error: "Error updating facility status" });
            }
            res.json({ message: `✅ Facility status changed to ${newStatus}` });
        });
    });
});

// ✅ API เปลี่ยนสถานะ Enable/Disable (รองรับทุกตาราง)
app.put("/toggle_status/:id", (req, res) => {
    const { id } = req.params;
    const { table } = req.body;

    if (!table) {
        return res.status(400).json({ error: "Table name is required" });
    }

    let idField;
    if (table === "dormitory_type") idField = "Dormitory_Type_ID";
    else if (table === "dormitory_category") idField = "Category_ID";
    else if (table === "facility") idField = "Facility_ID";
    else return res.status(400).json({ error: "Invalid table name" });

    // ดึงค่าปัจจุบัน
    db.query(`SELECT Status FROM ${table} WHERE ${idField} = ?`, [id], (err, result) => {
        if (err || result.length === 0) {
            console.error("❌ Error fetching current status:", err);
            return res.status(500).json({ error: "Toggle status error" });
        }

        const newStatus = result[0].Status === "enable" ? "disable" : "enable";

        // อัปเดตสถานะในฐานข้อมูล
        db.query(`UPDATE ${table} SET Status = ? WHERE ${idField} = ?`, [newStatus, id], (err) => {
            if (err) {
                console.error("❌ Error updating status:", err);
                return res.status(500).json({ error: "Update status error" });
            }
            res.json({ message: `✅ Status changed to ${newStatus}`, newStatus });
        });
    });
});

app.put("/api/dormitories/:id/toggle-status", (req, res) => {
    const { id } = req.params;

    // ดึงสถานะปัจจุบันจากฐานข้อมูล
    db.query("SELECT Status FROM dormitory WHERE Dormitory_ID = ?", [id], (err, result) => {
        if (err || result.length === 0) {
            console.error("❌ Error fetching dormitory status:", err);
            return res.status(500).json({ error: "Error fetching dormitory status" });
        }

        // สลับสถานะจาก "enable" เป็น "disable" และกลับกัน
        const newStatus = result[0].Status === "enable" ? "disable" : "enable";

        // อัปเดตสถานะใหม่ในฐานข้อมูล
        db.query("UPDATE dormitory SET Status = ? WHERE Dormitory_ID = ?", [newStatus, id], (err) => {
            if (err) {
                console.error("❌ Error updating dormitory status:", err);
                return res.status(500).json({ error: "Error updating dormitory status" });
            }

            res.json({ message: `✅ Dormitory status changed to ${newStatus}`, newStatus });
        });
    });
});

// ✅ API สำหรับผู้ดูแลระบบ (ดึงหอพักทั้งหมด)
app.get("/api/admin/dormitories", (req, res) => {
    const sql = `
        SELECT dormitory.*, user.Username AS Owner, dormitory_type.Dormitory_Type
        FROM dormitory 
        INNER JOIN user ON dormitory.Owner_ID = user.User_ID
        INNER JOIN dormitory_type ON dormitory.Dormitory_Type_ID = dormitory_type.Dormitory_Type_ID
    `;
    db.query(sql, (err, result) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(result);
    });
});

// ✅ API สำหรับเจ้าของหอพัก (ดึงเฉพาะหอพักของตัวเอง)
// app.get("/api/owner/dormitories/:owner_id", (req, res) => {
//     const ownerID = req.params.owner_id;

//     const sql = `
//         SELECT 
//             dormitory.Dormitory_ID, dormitory.Dormitory_Name, dormitory.Description, dormitory.Contact_Number, dormitory.Dormitory_Email, 
//             dormitory_type.Dormitory_Type, dormitory_category.Category_Name,
//             GROUP_CONCAT(DISTINCT facility.Facility_Name ORDER BY facility.Facility_Name SEPARATOR ', ') AS Facilities
//         FROM dormitory
//         LEFT JOIN dormitory_type ON dormitory.Dormitory_Type_ID = dormitory_type.Dormitory_Type_ID
//         LEFT JOIN dormitory_category ON dormitory.Category_ID = dormitory_category.Category_ID
//         LEFT JOIN con_fasility_dormitory ON dormitory.Dormitory_ID = con_fasility_dormitory.Dormitory_ID
//         LEFT JOIN facility ON con_fasility_dormitory.Facility_ID = facility.Facility_ID
//         WHERE dormitory.Owner_ID = ?
//         GROUP BY dormitory.Dormitory_ID
//     `;

//     db.query(sql, [ownerID], (err, result) => {
//         if (err) {
//             console.error("❌ Error fetching dormitories:", err);
//             return res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลหอพัก" });
//         }
//         if (result.length === 0) {
//             return res.status(404).json({ error: "ไม่พบข้อมูลหอพักของเจ้าของ" });
//         }
//         res.json(result);
//     });
// });
// app.get("/api/owner/dormitories/:owner_id", (req, res) => {
//     const ownerID = req.params.owner_id;

//     const sql = `
//         SELECT 
//             dormitory.Dormitory_ID, dormitory.Dormitory_Name, dormitory.Description, dormitory.Contact_Number, dormitory.Dormitory_Email, 
//             dormitory_type.Dormitory_Type, dormitory_category.Category_Name,
//             GROUP_CONCAT(DISTINCT facility.Facility_Name ORDER BY facility.Facility_Name SEPARATOR ', ') AS Facilities
//         FROM dormitory
//         LEFT JOIN dormitory_type ON dormitory.Dormitory_Type_ID = dormitory_type.Dormitory_Type_ID
//         LEFT JOIN dormitory_category ON dormitory.Category_ID = dormitory_category.Category_ID
//         LEFT JOIN con_fasility_dormitory ON dormitory.Dormitory_ID = con_fasility_dormitory.Dormitory_ID
//         LEFT JOIN facility ON con_fasility_dormitory.Facility_ID = facility.Facility_ID
//         WHERE dormitory.Owner_ID = ?
//         GROUP BY dormitory.Dormitory_ID
//     `;

//     db.query(sql, [ownerID], (err, result) => {
//         if (err) {
//             console.error("❌ Error fetching dormitories:", err);
//             return res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลหอพัก" });
//         }
//         if (result.length === 0) {
//             return res.status(404).json({ error: "ไม่พบข้อมูลหอพักของเจ้าของ" });
//         }
//         res.json(result);
//     });
// });
app.get("/api/owner/dormitories/:owner_id", (req, res) => {
    const ownerID = req.params.owner_id;

    const sql = `
        SELECT dormitory.*, dormitory_type.Dormitory_Type, dormitory_category.Category_Name
        FROM dormitory
        LEFT JOIN dormitory_type ON dormitory.Dormitory_Type_ID = dormitory_type.Dormitory_Type_ID
        LEFT JOIN dormitory_category ON dormitory.Category_ID = dormitory_category.Category_ID
        WHERE dormitory.Owner_ID = ?
    `;

    db.query(sql, [ownerID], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "❌ Error fetching dormitories" });
        }
        res.json(result);
    });
});

// ✅ API สำหรับเปลี่ยนสถานะหอพัก
// app.put("/api/dormitories/:id/status", (req, res) => {
//     const dormitoryID = req.params.id;
//     const { Status } = req.body;

//     console.log(`🔄 กำลังเปลี่ยนสถานะหอพัก ID: ${dormitoryID} เป็น ${Status}`);

//     if (!Status || (Status !== "enable" && Status !== "disable")) {
//         return res.status(400).json({ error: "ค่าของสถานะไม่ถูกต้อง" });
//     }

//     db.query("UPDATE dormitory SET Status = ? WHERE Dormitory_ID = ?", [Status, dormitoryID], (err, result) => {
//         if (err) {
//             console.error("❌ Error updating dormitory status:", err);
//             return res.status(500).json({ error: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะหอพัก" });
//         }

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: "ไม่พบข้อมูลหอพัก" });
//         }

//         console.log(`✅ เปลี่ยนสถานะหอพัก ID ${dormitoryID} เป็น "${Status}" สำเร็จ`);
//         res.json({ message: `✅ เปลี่ยนสถานะหอพักเป็น "${Status}" สำเร็จ!`, newStatus: Status });
//     });
// });
app.put("/api/dormitories/:id/status", async (req, res) => {
    const dormitoryID = req.params.id;
    const { status } = req.body;

    console.log(`🔄 กำลังเปลี่ยนสถานะหอพัก ID: ${dormitoryID} เป็น "${status}"`);

    if (!["enable", "rejected"].includes(status)) {
        return res.status(400).json({ error: "ค่าของสถานะไม่ถูกต้อง" });
    }

    try {
        // ✅ อัปเดตสถานะหอพัก
        await db.promise().query(
            "UPDATE dormitory SET Status = ? WHERE Dormitory_ID = ?",
            [status, dormitoryID]
        );

        console.log(`✅ สถานะของหอพัก ID: ${dormitoryID} เปลี่ยนเป็น "${status}" แล้ว`);

        // ✅ ดึงข้อมูลสิ่งอำนวยความสะดวก
        const [facilities] = await db.promise().query(
            `SELECT f.Facility_ID, f.Facility_Name 
            FROM facility f
            JOIN con_fasility_dormitory cfd ON f.Facility_ID = cfd.Facility_ID
            WHERE cfd.Dormitory_ID = ?`,
            [dormitoryID]
        );

        res.json({
            message: `✅ เปลี่ยนสถานะหอพักเป็น "${status}" สำเร็จ!`,
            newStatus: status,
            facilities
        });

    } catch (error) {
        console.error("❌ Error updating dormitory status:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะหอพัก" });
    }
});

// ✅ API ดึงข้อมูลหอพักตาม ID
// app.put("/api/dormitories/status/:id", (req, res) => { 
//     const dormitoryID = req.params.id;
//     const sql = `
//         SELECT dormitory.*, dormitory_type.Dormitory_Type AS Type, dormitory_category.Category_Name AS Category, facility.Facility_Name AS Facility
//         FROM dormitory
//         LEFT JOIN dormitory_type ON dormitory.Dormitory_Type_ID = dormitory_type.Dormitory_Type_ID
//         LEFT JOIN dormitory_category ON dormitory.Category_ID = dormitory_category.Category_ID
//         LEFT JOIN facility ON dormitory.Facility_ID = facility.Facility_ID
//         WHERE dormitory.Dormitory_ID = ?
//     `;

//     db.query(sql, [dormitoryID], (err, result) => {
//         if (err) return res.status(500).json({ error: err.message });
//         if (result.length === 0) return res.status(404).json({ error: "ไม่พบข้อมูลหอพัก" });
//         res.json(result[0]);
//     });
// });


// ✅ API อัปเดตข้อมูลหอพัก
app.put("/api/dormitories/:id", async (req, res) => {
    const dormitoryID = parseInt(req.params.id);
    console.log('dsadas');

    const { Dormitory_Name, Description, Contact_Number, Dormitory_Email, Dormitory_Type_ID, Category_ID, Facilities } = req.body;

    console.log("Facilities:", Facilities)
    let newFacilities = Facilities.map(item => {
        return [dormitoryID, item]
    })
    console.log('after:', newFacilities)

    const sql = `
        UPDATE dormitory 
        SET Dormitory_Name = ?, Description = ?, Contact_Number = ?, Dormitory_Email = ?, 
            Dormitory_Type_ID = ?, Category_ID = ?
        WHERE Dormitory_ID = ?;
    `;

    const deleteFacilitiesSQL = `DELETE FROM con_fasility_dormitory WHERE Dormitory_ID = ?;`;
    const insertFacilitiesSQL = `INSERT INTO con_fasility_dormitory (Dormitory_ID, Facility_ID) VALUES ?`;

    try {
        // เริ่มต้นการอัปเดตข้อมูลหอพัก
        await db.promise().query(sql, [Dormitory_Name, Description, Contact_Number, Dormitory_Email, Dormitory_Type_ID, Category_ID, dormitoryID]);
        console.log(`✅ Dormitory updated successfully with ID: ${dormitoryID}`);

        // ลบข้อมูลเก่าของสิ่งอำนวยความสะดวก          
        await db.promise().query(deleteFacilitiesSQL, [dormitoryID]);
        console.log(`🗑️ Deleted old facilities for Dormitory ID: ${dormitoryID}`);
        const facilitiesArray = newFacilities
        await db.promise().query(insertFacilitiesSQL, [facilitiesArray]);
        console.log(`✅ Facilities added for Dormitory ID: ${dormitoryID}`);
        // เพิ่มข้อมูลสิ่งอำนวยความสะดวกใหม่
        // if (Facilities && Facilities.length > 0) {
        //     // const facilitiesArray = Facilities.map(facilityID => [dormitoryID, facilityID]); // Assuming Facilities is an array of facility IDs
        //     const facilitiesArray = [1, 6]
        //     await db.promise().query(insertFacilitiesSQL, [facilitiesArray]);
        //     console.log(`✅ Facilities added for Dormitory ID: ${dormitoryID}`);
        // }

        return res.json({ message: "✅ อัปเดตข้อมูลหอพักสำเร็จ!" });

    } catch (error) {
        console.error("❌ Error occurred while updating dormitory:", error);
        return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลหอพัก", error: error.message });
    }
});

// ดึงข้อมูลหอพักพร้อมแสดงชื่อสิ่งอำนวยความสะดวก
app.get("/api/dormitories", (req, res) => {
    const sql = `
        SELECT d.*, GROUP_CONCAT(f.Facility_Name) AS Facility_Names
        FROM dormitory d
        LEFT JOIN facilities f ON FIND_IN_SET(f.Facility_ID, REPLACE(d.Facilities, '\"', ''))
        GROUP BY d.Dormitory_ID;
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Error fetching dormitories:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
        }
        res.json(results);
    });
});

// ✅ API: เพิ่มหอพักโดยเจ้าของ (สถานะเริ่มต้น = 'pending_approval')
app.post('/api/dormitories', upload.single('Dormitory_Photo'), async (req, res) => {
    console.log("📝 Data Received:", req.body);
    console.log("📸 Uploaded File:", req.file);

    const { Dormitory_Name, Description, Latitude, Longitude, Contact_Number, Dormitory_Email, Dormitory_Type_ID, Category_ID, User_ID, Owner_ID, Facilities } = req.body;
    const dormPhoto = req.file ? req.file.filename : null;

    if (!Dormitory_Name || !Dormitory_Type_ID || !Category_ID || !User_ID || !Owner_ID) {
        return res.status(400).json({ message: "⚠️ ข้อมูลไม่ครบถ้วน กรุณากรอกทุกช่องที่จำเป็น" });
    }

    try {
        let facilitiesArray = JSON.parse(Facilities);
        if (!Array.isArray(facilitiesArray) || facilitiesArray.some(id => typeof id !== "number")) {
            throw new Error("Facilities ต้องเป็น array ของตัวเลข");
        }

        const insertDormitorySQL = `
            INSERT INTO dormitory 
            (Dormitory_Name, Description, Dormitory_Photo, Latitude, Longitude, Contact_Number, Dormitory_Email, Dormitory_Type_ID, Category_ID, User_ID, Owner_ID, Status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval')
        `;

        const dormitoryValues = [
            Dormitory_Name, Description || null, dormPhoto || null,
            Latitude || null, Longitude || null, Contact_Number || null,
            Dormitory_Email || null, Dormitory_Type_ID, Category_ID, User_ID, Owner_ID
        ];

        const [dormitoryResult] = await db.promise().execute(insertDormitorySQL, dormitoryValues);
        const newDormitoryID = dormitoryResult.insertId;

        if (facilitiesArray.length > 0) {
            const insertFacilitiesSQL = `INSERT INTO con_fasility_dormitory (Dormitory_ID, Facility_ID) VALUES ?`;
            const facilitiesValues = facilitiesArray.map(facilityID => [newDormitoryID, facilityID]);
            await db.promise().query(insertFacilitiesSQL, [facilitiesValues]);
        }

        console.log("📢 แจ้งเตือนผู้ดูแลระบบ: มีหอพักใหม่รอการอนุมัติ!");
        res.json({ message: "✅ เพิ่มข้อมูลหอพักเรียบร้อย! รอการอนุมัติจากผู้ดูแลระบบ", dormitoryId: newDormitoryID });

    } catch (error) {
        console.error("❌ Error adding dormitory:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล", error: error.message });
    }
});

app.get("/api/dormitories/:id", (req, res) => {
    const { id } = req.params;

    // ✅ Query ดึงข้อมูลหอพัก + JOIN ประเภทหอพัก และหมวดหมู่
    const dormitoryQuery = `
        SELECT 
            d.*, 
            dt.Dormitory_Type,  -- ดึงชื่อประเภทหอพัก
            dc.Category_Name    -- ดึงชื่อหมวดหมู่หอพัก
        FROM dormitory d
        LEFT JOIN dormitory_type dt ON d.Dormitory_Type_ID = dt.Dormitory_Type_ID
        LEFT JOIN dormitory_category dc ON d.Category_ID = dc.Category_ID
        WHERE d.Dormitory_ID = ?
    `;

    // ✅ Query ดึงสิ่งอำนวยความสะดวกที่เกี่ยวข้องกับหอพัก
    const facilityQuery = `
        SELECT f.Facility_ID, f.Facility_Name 
        FROM facility f
        JOIN con_fasility_dormitory cfd ON f.Facility_ID = cfd.Facility_ID
        WHERE cfd.Dormitory_ID = ?
    `;

    db.query(dormitoryQuery, [id], (err, dormResult) => {
        if (err || dormResult.length === 0) {
            console.error("❌ Error fetching dormitory:", err);
            return res.status(404).json({ error: "ไม่พบข้อมูลหอพัก" });
        }

        // ✅ ดึงข้อมูลสิ่งอำนวยความสะดวก
        db.query(facilityQuery, [id], (err, facilityResult) => {
            if (err) {
                console.error("❌ Error fetching facilities:", err);
                return res.status(500).json({ error: "เกิดข้อผิดพลาดในการโหลดสิ่งอำนวยความสะดวก" });
            }

            // ✅ รวมข้อมูลหอพัก + สิ่งอำนวยความสะดวก + ประเภท + หมวดหมู่
            const dormitoryData = {
                ...dormResult[0], // ดึงข้อมูลหอพัก
                facilities: facilityResult // ✅ ใส่สิ่งอำนวยความสะดวก
            };

            res.json(dormitoryData);
        });
    });
});

app.put("/api/dormitories/:id", (req, res) => {
    const { id } = req.params; // ✅ ใช้ ID ที่ถูกต้องจาก URL
    console.log(`🔍 กำลังอัปเดต Dormitory_ID: ${id}`); // Debugging

    const { Dormitory_Name, Description, Contact_Number, Dormitory_Email, Dormitory_Type_ID, Category_ID, Facilities } = req.body;

    console.log(`🛠 Facility_IDs for Dormitory_ID ${id}:`, Facilities); // ตรวจสอบค่าก่อนอัปเดต

    db.beginTransaction(err => {
        if (err) {
            console.error("❌ Error starting transaction:", err);
            return res.status(500).json({ error: "เกิดข้อผิดพลาดในการเริ่ม Transaction" });
        }

        // ✅ อัปเดตข้อมูลหอพัก
        const updateDormitoryQuery = `
            UPDATE dormitory
            SET Dormitory_Name = ?, Description = ?, Contact_Number = ?, Dormitory_Email = ?, Dormitory_Type_ID = ?, Category_ID = ?
            WHERE Dormitory_ID = ?
        `;

        db.query(updateDormitoryQuery, [Dormitory_Name, Description, Contact_Number, Dormitory_Email, Dormitory_Type_ID, Category_ID, id], (err) => {
            if (err) {
                return db.rollback(() => {
                    console.error("❌ Error updating dormitory:", err);
                    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลหอพัก" });
                });
            }

            // ✅ ลบเฉพาะสิ่งอำนวยความสะดวกที่ไม่ได้เลือกแล้ว
            const deleteFacilitiesQuery = `
                DELETE FROM con_fasility_dormitory
                WHERE Dormitory_ID = ? AND Facility_ID NOT IN (?)
            `;
            db.query(deleteFacilitiesQuery, [id, Facilities.length > 0 ? Facilities : [-1]], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error("❌ Error deleting facilities:", err);
                        res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบสิ่งอำนวยความสะดวกที่ไม่ได้เลือกแล้ว" });
                    });
                }

                // ✅ เพิ่มเฉพาะสิ่งอำนวยความสะดวกที่เลือกใหม่
                if (Facilities.length > 0) {
                    console.log('here')
                    const insertFacilitiesQuery = `
                        INSERT INTO con_fasility_dormitory (Dormitory_ID, Facility_ID)
                        SELECT ?, ? FROM DUAL
                        WHERE NOT EXISTS (
                            SELECT 1 FROM con_fasility_dormitory WHERE Dormitory_ID = ? AND Facility_ID = ?
                        )
                    `;

                    Facilities.forEach(facilityId => {
                        db.query(insertFacilitiesQuery, [id, facilityId, id, facilityId], (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error("❌ Error inserting new facilities:", err);
                                    res.status(500).json({ error: "เกิดข้อผิดพลาดในการเพิ่มสิ่งอำนวยความสะดวกใหม่" });
                                });
                            }
                        });
                    });
                }

                // ✅ Commit Transaction
                db.commit(err => {
                    if (err) {
                        return db.rollback(() => {
                            console.error("❌ Error committing transaction:", err);
                            res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
                        });
                    }

                    console.log(`✅ Dormitory_ID ${id} updated successfully!`);
                    res.json({ message: `✅ อัปเดตข้อมูลหอพัก ID ${id} สำเร็จ!` });
                });
            });
        });
    });
});

//อณุมัติไหม
app.put("/api/dormitories/app/:id/status", (req, res) => {
    const dormitoryID = req.params.id;
    const { status } = req.body; // "enable" หรือ "rejected"

    if (!["enable", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    db.query("UPDATE dormitory SET Status = ? WHERE Dormitory_ID = ?", [status, dormitoryID], (err, result) => {
        if (err) {
            console.error("❌ Error updating dormitory status:", err);
            return res.status(500).json({ error: "Error updating dormitory status" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Dormitory not found" });
        }

        res.json({ message: `✅ Dormitory status updated to "${status}" successfully!` });
    });
});

//ผู้ดูแล กดยืนยัน ให้ส่งข้อมูลไปให้เจ้าของหอพัก
app.post("/api/approve_dormitory/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.promise().beginTransaction();

        // 🔹 ดึงข้อมูลหอพักที่รอการอนุมัติ
        const [pendingDorm] = await db.promise().query(
            "SELECT * FROM pending_dormitories WHERE Pending_ID = ?", [id]
        );

        if (pendingDorm.length === 0) {
            return res.status(404).json({ message: "❌ ไม่พบหอพักที่ต้องการอนุมัติ" });
        }

        const dorm = pendingDorm[0];

        // 🔹 ย้ายข้อมูลไปยัง `dormitory`
        const insertDormSQL = `
            INSERT INTO dormitory 
            (Dormitory_Name, Description, Dormitory_Photo, Latitude, Longitude, Contact_Number, Dormitory_Email, Dormitory_Type_ID, Category_ID, User_ID, Owner_ID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [dormResult] = await db.promise().query(insertDormSQL, [
            dorm.Dormitory_Name, dorm.Description, dorm.Dormitory_Photo, dorm.Latitude, dorm.Longitude,
            dorm.Contact_Number, dorm.Dormitory_Email, dorm.Dormitory_Type_ID, dorm.Category_ID, dorm.User_ID, dorm.Owner_ID
        ]);
        const newDormitoryID = dormResult.insertId;

        // 🔹 ดึงสิ่งอำนวยความสะดวกที่เกี่ยวข้อง
        const [pendingFacilities] = await db.promise().query(
            "SELECT Facility_ID FROM pending_facilities WHERE Pending_ID = ?", [id]
        );

        if (pendingFacilities.length > 0) {
            const facilitiesData = pendingFacilities.map(facility => [newDormitoryID, facility.Facility_ID]);
            await db.promise().query("INSERT INTO con_fasility_dormitory (Dormitory_ID, Facility_ID) VALUES ?", [facilitiesData]);
        }

        // 🔹 ลบข้อมูลจาก `pending_dormitories` และ `pending_facilities`
        await db.promise().query("DELETE FROM pending_facilities WHERE Pending_ID = ?", [id]);
        await db.promise().query("DELETE FROM pending_dormitories WHERE Pending_ID = ?", [id]);

        await db.promise().commit();

        res.json({ message: "✅ หอพักได้รับการอนุมัติเรียบร้อย!", dormitoryId: newDormitoryID });

    } catch (error) {
        await db.promise().rollback();
        console.error("❌ Error approving dormitory:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอนุมัติหอพัก" });
    }
});

// ✅ API ดึงหอพักที่รอการอนุมัติจากฐานข้อมูล (pending_approval)
app.get("/api/dormitories/app/pending", (req, res) => {
    const sql = "SELECT * FROM dormitory WHERE Status = 'pending_approval'";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Error fetching pending dormitories:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "ไม่พบข้อมูลหอพัก" });
        }
        res.json(results);
    });
});

// ดึงห้องพัก
app.get("/api/dormitories/:id/rooms", (req, res) => {
    const dormitoryId = req.params.id;

    const query = `
        SELECT Room_ID, Room_Number, Room_Type, Price, Availability
        FROM room
        WHERE Dormitory_ID = ?
    `;

    db.query(query, [dormitoryId], (err, results) => {
        if (err) {
            console.error("❌ Error fetching rooms:", err);
            return res.status(500).json({ error: "เกิดข้อผิดพลาดในการโหลดห้องพัก" });
        }
        res.json(results);
    });
});


// API เพิ่มห้องพัก
app.post("/api/rooms", (req, res) => {
    const { Room_Number, Room_Type, Capacity, Availability, Price, Price_Type, Additional_Fees, Dormitory_ID } = req.body;

    if (!Room_Number || !Room_Type || !Capacity || !Price || !Price_Type || !Dormitory_ID) {
        return res.status(400).json({ error: "⚠️ กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const query = `
        INSERT INTO room (Room_Number, Room_Type, Capacity, Availability, Price, Price_Type, Additional_Fees, Dormitory_ID) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [Room_Number, Room_Type, Capacity, Availability, Price, Price_Type, Additional_Fees, Dormitory_ID], (err, result) => {
        if (err) {
            console.error("❌ Error adding room:", err);
            return res.status(500).json({ error: "❌ เกิดข้อผิดพลาดในการเพิ่มห้องพัก" });
        }
        res.json({ message: "✅ เพิ่มห้องพักสำเร็จ!", Room_ID: result.insertId });
    });
});

// API เปลี่ยนสถานะห้องพัก
app.put("/api/rooms/:id/status", (req, res) => {
    const { id } = req.params;
    const { Availability } = req.body;

    if (!Availability || (Availability !== "available" && Availability !== "not_available")) {
        return res.status(400).json({ error: "ค่าสถานะไม่ถูกต้อง" });
    }

    const query = `UPDATE room SET Availability = ? WHERE Room_ID = ?`;

    db.query(query, [Availability, id], (err, result) => {
        if (err) {
            console.error("❌ Error updating room status:", err);
            return res.status(500).json({ error: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะห้องพัก" });
        }
        res.json({ message: "✅ เปลี่ยนสถานะห้องพักสำเร็จ!" });
    });
});

// ดึงตาม id
app.get("/api/rooms/:id", (req, res) => {
    const { id } = req.params;
    const query = `SELECT * FROM room WHERE Room_ID = ?`;

    db.query(query, [id], (err, result) => {
        if (err || result.length === 0) {
            console.error("❌ Error fetching room:", err);
            return res.status(404).json({ error: "ไม่พบข้อมูลห้องพัก" });
        }
        res.json(result[0]);
    });
});

// ✅ อัปเดตข้อมูลห้องพัก
app.put("/api/rooms/:id", (req, res) => {
    const { id } = req.params;
    const { Room_Number, Room_Type, Capacity, Price, Price_Type, Additional_Fees } = req.body;

    const query = `
        UPDATE room 
        SET Room_Number=?, Room_Type=?, Capacity=?, Price=?, Price_Type=?, Additional_Fees=? 
        WHERE Room_ID=?
    `;

    db.query(query, [Room_Number, Room_Type, Capacity, Price, Price_Type, Additional_Fees, id], (err, result) => {
        if (err) {
            console.error("❌ Error updating room:", err);
            return res.status(500).json({ error: "ไม่สามารถอัปเดตข้อมูลห้องพัก" });
        }
        res.json({ message: "✅ อัปเดตห้องพักสำเร็จ!" });
    });
});

// ✅ ดึงรายการหอพักทั้งหมด (เฉพาะนักศึกษา)
app.get("/api/student/dormitories", (req, res) => {
    const { type, category } = req.query;

    let sql = `
        SELECT d.Dormitory_ID, d.Dormitory_Name, d.Contact_Number, d.Dormitory_Email, 
               d.Dormitory_Type_ID, d.Category_ID,
               IFNULL(GROUP_CONCAT(f.Facility_Name), 'ไม่มีข้อมูล') AS Facility_Names
        FROM dormitory d
        LEFT JOIN con_fasility_dormitory cfd ON d.Dormitory_ID = cfd.Dormitory_ID
        LEFT JOIN facility f ON cfd.Facility_ID = f.Facility_ID
        WHERE d.Status = 'enable'
    `;

    let params = [];

    if (type) {
        sql += " AND d.Dormitory_Type_ID = ?";
        params.push(type);
    }
    if (category) {
        sql += " AND d.Category_ID = ?";
        params.push(category);
    }

    sql += " GROUP BY d.Dormitory_ID";

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("❌ Error fetching dormitories:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
        }
        console.log("📌 ส่งหอพักทั้งหมด:", results.length);
        res.json(results);
    });
});


// ✅ ดึงรายละเอียดหอพัก (รวมประเภท, หมวดหมู่, สิ่งอำนวยความสะดวก)
app.get("/api/student/dormitories/:id", (req, res) => {
    const { id } = req.params;

    const dormitoryQuery = `
        SELECT 
            d.*, 
            IFNULL(GROUP_CONCAT(f.Facility_Name), 'ไม่มีข้อมูล') AS Facility_Names
        FROM dormitory d
        LEFT JOIN con_fasility_dormitory cfd ON d.Dormitory_ID = cfd.Dormitory_ID
        LEFT JOIN facility f ON cfd.Facility_ID = f.Facility_ID
        WHERE d.Dormitory_ID = ?
        GROUP BY d.Dormitory_ID;
    `;

    const roomQuery = `
        SELECT 
            Room_ID, Room_Number, Room_Type, Capacity, Price, Price_Type, Availability , Additional_Fees
        FROM room 
        WHERE Dormitory_ID = ?;
    `;

    db.query(dormitoryQuery, [id], (err, dormResult) => {
        if (err || dormResult.length === 0) {
            console.error("❌ Error fetching dormitory details:", err);
            return res.status(404).json({ message: "ไม่พบข้อมูลหอพัก" });
        }

        db.query(roomQuery, [id], (err, roomResult) => {
            if (err) {
                console.error("❌ Error fetching rooms:", err);
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการโหลดห้องพัก" });
            }

            res.json({
                ...dormResult[0],
                rooms: roomResult
            });
        });
    });
});

// ✅ ดึงข้อมูลห้องพักของหอพักที่เลือก
app.get("/api/dormitories/student/:id/rooms", (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT 
    Room_ID, Room_Number, Room_Type, Capacity, Price, Price_Type, Availability , Additional_Fees
    FROM room 
    WHERE Dormitory_ID = ?;
    `;
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error("❌ Error fetching rooms:", err);
            return res.status(500).json({ error: "เกิดข้อผิดพลาดในการโหลดข้อมูลห้องพัก" });
        }
        console.log("🔍 ตรวจสอบข้อมูลห้องพัก:", results); // ✅ Debug ตรงนี้
        res.json(results);
    });
});



// ✅ Start Server
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
