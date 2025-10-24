import express from "express";
import multer from "multer";
import {
    createBusiness,
    getAllBusiness,
    updateBusiness,
    deleteBusiness,
    createService,
    getServices,
    updateService,
    deleteService,
    addItem,
    getAllItems,
    updateItem,
    deleteItem,
    getBusinessByAdmin,
} from "../controllers/serviceController";
import { verifyToken, verifyAdmin, verifySuperAdmin } from "../middleware/authMiddleware";


const router = express.Router();
const upload = multer({storage: multer.memoryStorage()});

/**
 * @swagger
 * tags:
 *   name: Business
 *   description: Endpoints for managing business, services, and items
 */

/**
 * @swagger
 * /business/create:
 *   post:
 *     summary: Create a new business (Super Admin only)
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Business created successfully
 *       400:
 *         description: Name and description are required
 *       500:
 *         description: Internal server error
 */
router.post("/create", verifyToken, verifySuperAdmin, createBusiness);

/**
 * @swagger
 * /business/all:
 *   get:
 *     summary: Get all businesses (superadmin only)
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all businesses
 *       500:
 *         description: Internal server error
 */
router.get("/all", verifyToken, verifySuperAdmin, getAllBusiness)
/**
 * @swagger
 * /business/my-business:
 *   get:
 *     summary: Get the business assigned to the logged-in admin
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The admin’s assigned business details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "business123"
 *                 name:
 *                   type: string
 *                   example: "Spa and Wellness"
 *                 description:
 *                   type: string
 *                   example: "Luxury spa business with massage and therapy options"
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: No Business found for this admin
 *       500:
 *         description: Internal server error
 */

router.get("/my-business", verifyToken, verifyAdmin, getBusinessByAdmin);

/**
 * @swagger
 * /business/update/{businessId}: 
 *   patch:
 *     summary: Update a Business by ID (Super Admin only)
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Business updated successfully
 *       500:
 *         description: Internal server error
 */
router.patch("/update/:businessId", verifyToken, verifySuperAdmin, updateBusiness);

/**
 * @swagger
 * /business/delete/{businessId}:
 *   delete:
 *     summary: Delete a business by ID (Super Admin only)
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business deleted successfully
 *       500:
 *         description: Internal server error
 */
router.delete("/delete/:businessId", verifyToken, verifySuperAdmin, deleteBusiness);

/**
 * @swagger
 * /business/{businessId}/services/create:
 *   post:
 *     summary: Create a new service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Name and description are required
 *       500:
 *         description: Internal server error
 */
router.post("/:businessId/services/create", verifyToken, verifyAdmin, createService);

/**
 * @swagger
 * /business/{businessId}/services/all:
 *   get:
 *     summary: Get all services for a business
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of all subservices
 *       500:
 *         description: Internal server error
 */
router.get("/:businessId/services/all", getServices);

/**
 * @swagger
 * /business/{businessId}/services/update/{serviceId}:
 *   patch:
 *     summary: Update a service by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       500:
 *         description: Internal server error
 */
router.patch("/:businessId/services/update/:serviceId", verifyToken, verifyAdmin, updateService);

/**
 * @swagger
 * /business/{businessId}/services/delete/{serviceId}:
 *   delete:
 *     summary: Delete a service by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *       500:
 *         description: Internal server error
 */
router.delete("/:businessId/services/delete/:serviceId", verifyToken, verifyAdmin, deleteService);

/**
 * @swagger
 * /business/{businessId}/services/{serviceId}/items/add:
 *   post:
 *     summary: Add a new item
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Item created successfully
 *       400:
 *         description: Name, description, price, and image are required
 *       500:
 *         description: Internal server error
 */
router.post("/:businessId/services/:serviceId/items/add", verifyToken, verifyAdmin, upload.single("image"), addItem);

/**
 * @swagger
 * /business/{businessId}/services/{serviceId}/items/all:
 *   get:
 *     summary: Get all items for a subservice
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of all items
 *       500:
 *         description: Internal server error
 */
router.get("/:businessId/services/:serviceId/items/all", getAllItems);

/**
 * @swagger
 * /business/{businessId}/services/{serviceId}/items/update/{itemId}:
 *   patch:
 *     summary: Update an item by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       500:
 *         description: Internal server error
 */
router.patch("/:businessId/services/:serviceId/items/update/:itemId", verifyToken, verifyAdmin, upload.single("image"),updateItem);

/**
 * @swagger
 * /business/{businessId}/services/{serviceId}/items/delete/{itemId}:
 *   delete:
 *     summary: Delete an item by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *       500:
 *         description: Internal server error
 */
router.delete("/:businessId/services/:serviceId/items/delete/:itemId", verifyToken, verifyAdmin, deleteItem);

export default router;