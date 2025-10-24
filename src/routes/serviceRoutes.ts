import express from "express";
import multer from "multer";
import {
    createService,
    getAllServices,
    updateService,
    deleteService,
    createSubService,
    getSubServices,
    updateSubService,
    deleteSubService,
    addItem,
    getAllItems,
    updateItem,
    deleteItem,
    getServiceByAdmin,
} from "../controllers/serviceController";
import { verifyToken, verifyAdmin, verifySuperAdmin } from "../middleware/authMiddleware";


const router = express.Router();
const upload = multer({storage: multer.memoryStorage()});

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Endpoints for managing services, subservices, and items
 */

/**
 * @swagger
 * /service/create:
 *   post:
 *     summary: Create a new service (Super Admin only)
 *     tags: [Services]
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
 *         description: Service created successfully
 *       400:
 *         description: Name and description are required
 *       500:
 *         description: Internal server error
 */
router.post("/create", verifyToken, verifySuperAdmin, createService);

/**
 * @swagger
 * /service/all:
 *   get:
 *     summary: Get all a service (superadmin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all services
 *       500:
 *         description: Internal server error
 */
router.get("/all", verifyToken, verifySuperAdmin, getAllServices)
/**
 * @swagger
 * /service/my-service:
 *   get:
 *     summary: Get the service assigned to the logged-in admin
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The admin’s assigned service details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "service123"
 *                 name:
 *                   type: string
 *                   example: "Spa and Wellness"
 *                 description:
 *                   type: string
 *                   example: "Luxury spa services with massage and therapy options"
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: No service found for this admin
 *       500:
 *         description: Internal server error
 */

router.get("/my-service", verifyToken, verifyAdmin, getServiceByAdmin);

/**
 * @swagger
 * /service/update/{serviceId}: 
 *   patch:
 *     summary: Update a service by ID (Super Admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
router.patch("/update/:serviceId", verifyToken, verifySuperAdmin, updateService);

/**
 * @swagger
 * /service/delete/{serviceId}:
 *   delete:
 *     summary: Delete a service by ID (Super Admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
router.delete("/delete/:serviceId", verifyToken, verifySuperAdmin, deleteService);

/**
 * @swagger
 * /service/{serviceId}/subservices/create:
 *   post:
 *     summary: Create a new subservice
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       201:
 *         description: Subservice created successfully
 *       400:
 *         description: Name and description are required
 *       500:
 *         description: Internal server error
 */
router.post("/:serviceId/subservices/create", verifyToken, verifyAdmin, createSubService);

/**
 * @swagger
 * /service/{serviceId}/subservices/all:
 *   get:
 *     summary: Get all subservices for a service
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of all subservices
 *       500:
 *         description: Internal server error
 */
router.get("/:serviceId/subservices/all", getSubServices);

/**
 * @swagger
 * /service/{serviceId}/subservices/update/{subServiceId}:
 *   patch:
 *     summary: Update a subservice by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subServiceId
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
 *         description: Subservice updated successfully
 *       500:
 *         description: Internal server error
 */
router.patch("/:serviceId/subservices/update/:subServiceId", verifyToken, verifyAdmin, updateSubService);

/**
 * @swagger
 * /service/{serviceId}/subservices/delete/{subServiceId}:
 *   delete:
 *     summary: Delete a subservice by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subServiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subservice deleted successfully
 *       500:
 *         description: Internal server error
 */
router.delete("/:serviceId/subservices/delete/:subServiceId", verifyToken, verifyAdmin, deleteSubService);

/**
 * @swagger
 * /service/{serviceId}/subservices/{subServiceId}/items/add:
 *   post:
 *     summary: Add a new item
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subServiceId
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
router.post("/:serviceId/subservices/:subServiceId/items/add", verifyToken, verifyAdmin, upload.single("image"), addItem);

/**
 * @swagger
 * /service/{serviceId}/subservices/{subServiceId}/items/all:
 *   get:
 *     summary: Get all items for a subservice
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subServiceId
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
router.get("/:serviceId/subservices/:subServiceId/items/all", getAllItems);

/**
 * @swagger
 * /service/{serviceId}/subservices/{subServiceId}/items/update/{itemId}:
 *   patch:
 *     summary: Update an item by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subServiceId
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
router.patch("/:serviceId/subservices/:subServiceId/items/update/:itemId", verifyToken, verifyAdmin, upload.single("image"),updateItem);

/**
 * @swagger
 * /service/{serviceId}/subservices/{subServiceId}/items/delete/{itemId}:
 *   delete:
 *     summary: Delete an item by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subServiceId
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
router.delete("/:serviceId/subservices/:subServiceId/items/delete/:itemId", verifyToken, verifyAdmin, deleteItem);

export default router;