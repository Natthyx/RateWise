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
} from "../controllers/serviceController";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware";


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
 * /services/create:
 *   post:
 *     summary: Create a new service
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
router.post("/create", verifyToken, verifyAdmin, createService);

/**
 * @swagger
 * /services/all:
 *   get:
 *     summary: Get all services
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of all services
 *       500:
 *         description: Internal server error
 */
router.get("/all", getAllServices);

/**
 * @swagger
 * /services/update/{serviceId}:
 *   patch:
 *     summary: Update a service by ID
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
router.patch("/update/:serviceId", verifyToken, verifyAdmin, updateService);

/**
 * @swagger
 * /services/delete/{serviceId}:
 *   delete:
 *     summary: Delete a service by ID
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
router.delete("/delete/:serviceId", verifyToken, verifyAdmin, deleteService);

/**
 * @swagger
 * /services/{serviceId}/subservices/create:
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
 * /services/{serviceId}/subservices/all:
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
 * /services/{serviceId}/subservices/update/{subServiceId}:
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
 * /services/{serviceId}/subservices/delete/{subServiceId}:
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
 * /services/{serviceId}/subservices/{subServiceId}/items/add:
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
 * /services/{serviceId}/subservices/{subServiceId}/items/all:
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
 * /services/{serviceId}/subservices/{subServiceId}/items/update/{itemId}:
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
 * /services/{serviceId}/subservices/{subServiceId}/items/delete/{itemId}:
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