const express = require('express');
const router = express.Router();
const { Spots, SpotImages, Users, Reviews, Bookings} = require("../../db/models");
const { requireAuth } = require("../../utils/auth");
const { check, validationResult } = require('express-validator');



//GET Spots
router.get('/', async (req, res) => {
  try {
    const spots = await Spots.findAll();
    res.json({ Spots: spots });
  } catch (err) {
    console.error('Error retrieving spots:', err);
    res.status(500).json({ message: "Server error", errors: err.errors });
  }
});
//Create a spot
router.post('/', requireAuth, async (req, res) => {
    const { address, city, state, country, lat, lng, name, description, price } = req.body;

    try {
      const newSpot = await Spots.create({
        ownerId: req.user.id,
        address,
        city,
        state,
        country,
        lat,
        lng,
        name,
        description,
        price
      });

      res.status(201).json(newSpot);
    } catch (err) {
      res.status(400).json({ message: "Bad Request", errors: err.errors });
    }
  });

//details of a spot from an id
router.get('/:spotId', async (req, res) => {
  const { spotId } = req.params;

  try {
    const spot = await Spots.findByPk(spotId, {
      include: [
        { model: SpotImages, attributes: ['id', 'url', 'preview'] },
        { model: Users, as: 'Owner', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    return res.status(200).json(spot);
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all spots owned by the current user
router.get('/current', requireAuth, async (req, res) => {
  try {
    const spots = await Spots.findAll({
      where: { ownerId: req.user.id }
    });
    return res.status(200).json({ Spots: spots });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});



  // Get Spot by ID and details (Owner, SpotImages, Reviews)
router.get('/:id', async (req, res) => {
  const spotId = req.params.id;

  try {
    // Find spot by ID
    const spot = await Spots.findByPk(spotId, {
      include: [
        // the owner (User) data
        {
          model: 'Users',
          as: 'Owner',
          attributes: ['id', 'firstName', 'lastName'],
        },
        // spot images
        {
          model: 'SpotImages',
          attributes: ['id', 'url', 'preview'],
        },
      ],
    });

    if (!spot) {
      return res.status(404).json({ message: 'Spot not found', statusCode: 404 });
    }

    // Get # of reviews and avg rating
    const reviews = await Reviews.findAll({
      where: { spotId: spot.id },
      attributes: ['stars'],
    });

    const numReviews = reviews.length;
    const avgStarRating = reviews.length
      ? reviews.reduce((sum, review) => sum + review.stars, 0) / numReviews
      : 0;

    // response object
    const spotDetails = {
      id: spot.id,
      ownerId: spot.ownerId,
      address: spot.address,
      city: spot.city,
      state: spot.state,
      country: spot.country,
      lat: spot.lat,
      lng: spot.lng,
      name: spot.name,
      description: spot.description,
      price: spot.price,
      createdAt: spot.createdAt,
      updatedAt: spot.updatedAt,
      numReviews: numReviews,
      avgStarRating: avgStarRating,
      SpotImages: spot.SpotImages,
      Owner: spot.Owner,
    };

    res.json(spotDetails);
  } catch (error) {
    console.error('Error fetching spot details:', error);
    res.status(500).json({ message: 'Internal server error', statusCode: 500 });
  }
});


// PUT /spots/:id - Update a spot
router.put('/:id', requireAuth, async (req, res) => {
  const spotId = req.params.id;
  const userId = req.user.id; // `req.user.id` is set after auth
  const { address, city, state, country, lat, lng, name, description, price } = req.body;

  try {
    // find spot by ID
    const spot = await Spots.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({ message: 'Spot not found', statusCode: 404 });
    }

    // if the authenticated user is the owner of spot
    if (spot.ownerId !== userId) {
      return res.status(403).json({ message: 'Forbidden - You are not the owner of this spot', statusCode: 403 });
    }

    // validate the req body
    if (!address || !city || !state || !country || !lat || !lng || !name || !description || !price) {
      return res.status(400).json({
        message: 'Validation error - Missing required fields',
        statusCode: 400,
        errors: {
          address: !address ? 'Address is required' : undefined,
          city: !city ? 'City is required' : undefined,
          state: !state ? 'State is required' : undefined,
          country: !country ? 'Country is required' : undefined,
          lat: !lat ? 'Latitude is required' : undefined,
          lng: !lng ? 'Longitude is required' : undefined,
          name: !name ? 'Name is required' : undefined,
          description: !description ? 'Description is required' : undefined,
          price: !price ? 'Price is required' : undefined,
        },
      });
    }

    // update spot with new data
    await spot.update({
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
    });

    // return updated spot details
    return res.json({
      id: spot.id,
      ownerId: spot.ownerId,
      address: spot.address,
      city: spot.city,
      state: spot.state,
      country: spot.country,
      lat: spot.lat,
      lng: spot.lng,
      name: spot.name,
      description: spot.description,
      price: spot.price,
      createdAt: spot.createdAt,
      updatedAt: spot.updatedAt,
    });
  } catch (error) {
    console.error('Error updating spot:', error);
    res.status(500).json({ message: 'Internal server error', statusCode: 500 });
  }
});

// DELETE /spots/:id - Delete a spot
router.delete('/:id', requireAuth, async (req, res) => {
  const spotId = req.params.id;
  const userId = req.user.id;

  try {
    // spot by ID
    const spot = await Spots.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({ message: 'Spot not found', statusCode: 404 });
    }

    // if the auth user is the owner of the spot?
    if (spot.ownerId !== userId) {
      return res.status(403).json({ message: 'Forbidden - You are not the owner of this spot', statusCode: 403 });
    }

    // Delete spot
    await spot.destroy();

    // Return a success message
    return res.json({ message: 'Successfully deleted', statusCode: 200 });
  } catch (error) {
    console.error('Error deleting spot:', error);
    res.status(500).json({ message: 'Internal server error', statusCode: 500 });
  }
});
//query parameter validator
router.get( '/',
  [
      check('page').optional().isInt({ min: 1 }).withMessage('Page must be an integer greater than or equal to 1'),
      check('size').optional().isInt({ min: 1, max: 20 }).withMessage('Size must be an integer between 1 and 20'),
      check('minLat').optional().isFloat({ min: -90, max: 90 }).withMessage('minLat must be a valid latitude'),
      check('maxLat').optional().isFloat({ min: -90, max: 90 }).withMessage('maxLat must be a valid latitude'),
      check('minLng').optional().isFloat({ min: -180, max: 180 }).withMessage('minLng must be a valid longitude'),
      check('maxLng').optional().isFloat({ min: -180, max: 180 }).withMessage('maxLng must be a valid longitude'),
      check('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be greater than or equal to 0'),
      check('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be greater than or equal to 0'),
  ],
  async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      // GET /api/spots - Return spots filtered by query parameters
  router.get('/', async (req, res) => {
    try {
        let { page = 1, size = 20, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;

        // Convert page and size to integers and apply default limits
        page = parseInt(page);
        size = parseInt(size);

        // Limit the maximum page size
        if (size > 20) size = 20;
        if (page < 1) page = 1;

        // Build query filters based on optional parameters
        const filters = {};

        if (minLat) filters.lat = { ...filters.lat, [Op.gte]: parseFloat(minLat) };
        if (maxLat) filters.lat = { ...filters.lat, [Op.lte]: parseFloat(maxLat) };

        if (minLng) filters.lng = { ...filters.lng, [Op.gte]: parseFloat(minLng) };
        if (maxLng) filters.lng = { ...filters.lng, [Op.lte]: parseFloat(maxLng) };

        if (minPrice) filters.price = { ...filters.price, [Op.gte]: parseFloat(minPrice) };
        if (maxPrice) filters.price = { ...filters.price, [Op.lte]: parseFloat(maxPrice) };

        // Fetch spots from the database with applied filters
        const spots = await Spots.findAll({
            where: filters,
            limit: size,
            offset: (page - 1) * size,
            attributes: ['id', 'ownerId', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'description', 'price', 'createdAt', 'updatedAt'],
        });

        // Return spots data along with pagination info
        return res.json({
            Spots: spots,
            page,
            size,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
  });
  }
);


// get all bookings for a spot based on spot id
router.get("/:spotId/bookings", requireAuth, async (req, res) => {
  const spotId = req.params.spotId;
  const currentUserId = req.user.id; //req.user contains the authenticated user info

  try {
    // Find the spot first to check ownership
    const spot = await Spots.findByPk(spotId);

    // If the spot is not found, return a 404 error
    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    // Determine if the current user is the owner of the spot
    const isOwner = spot.ownerId === currentUserId;

    // Set up the include for the Booking model
    let include = [
      {
        model: Bookings,
        attributes: ["spotId","startDate", "endDate"],
      },
    ];

    // If the user is the owner, add the User model to the include
    if (isOwner) {
      include = [
        {
          model: Bookings,
          include: [
            { model: Users, attributes: ["id", "firstName", "lastName"] },
          ],
          attributes: [
            "id",
            "spotId",
            "userId",
            "startDate",
            "endDate",
            "createdAt",
            "updatedAt",
          ],
        },
      ];
    }

    // Now, find the spot again with the proper include (based on ownership)
    const spotWithBookings = await Spots.findByPk(spotId, { include });

    // Map through the bookings and customize the response based on ownership
    const bookings = spotWithBookings.Bookings.map((booking) => {
      if (isOwner) {
        // Detailed booking info with user data for the owner
        return {
          User: {
            id: booking.Users.id,
            firstName: booking.Users.firstName,
            lastName: booking.Users.lastName,
          },
          id: booking.id,
          spotId: booking.spotId,
          userId: booking.userId,
          startDate: booking.startDate,
          endDate: booking.endDate,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        };
      } else {
        // Basic booking info for non-owners
        return {
          spotId: booking.spotId,
          startDate: booking.startDate,
          endDate: booking.endDate,
        };
      }
    });

    // Return the bookings in the correct format
    return res.status(200).json({ Bookings: bookings });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//add image
router.post('/:spotId/images', requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const { url, preview } = req.body;
  const userId = req.user.id;

  try {
    // Find the spot
    const spot = await Spots.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    // Check if the current user is the owner of the spot
    if (spot.ownerId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Create and add the image
    const newImage = await SpotImages.create({
      spotId,
      url,
      preview
    });

    return res.status(201).json({
      id: newImage.id,
      url: newImage.url,
      preview: newImage.preview
    });
  } catch (error) {
    console.error('Error adding image to spot:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }

})

// GET /spots/:spotId/reviews - Get all reviews for a spot
router.get('/:spotId/reviews', async (req, res) => {
  const { spotId } = req.params;

  try {
    // if the spot exists?
    const spot = await Spots.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found",
        statusCode: 404,
      });
    }

    // Find all reviews for the given spotId
    const spotReviews = await Reviews.findAll({
      where: { spotId },
      include: [
        {
          model: Users,
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: ReviewImages,
          attributes: ['id', 'url'],
        },
      ],
    });


    return res.status(200).json({
      Reviews: spotReviews.map(review => ({
        id: review.id,
        userId: review.userId,
        spotId: review.spotId,
        review: review.review,
        stars: review.stars,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        User: {
          id: review.Users.id,
          firstName: review.Users.firstName,
          lastName: review.Users.lastName,
        },
        ReviewImages: review.ReviewImages.map(image => ({
          id: image.id,
          url: image.url,
        })),
      })),
    });
  } catch (error) {
    console.error('Error fetching reviews for the spot:', error);
    return res.status(500).json({
      message: 'Internal server error',
      statusCode: 500,
    });
  }
});

// POST /spots/:id/reviews - Create a new review for a spot
router.post('/:id/reviews', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const spotId = req.params.id;
  const { review, stars } = req.body;

  // Validate req body
  if (!review || typeof review !== 'string' || !stars || typeof stars !== 'number' || stars < 1 || stars > 5) {
    return res.status(400).json({
      message: 'Validation error: Review and stars are required. Stars must be between 1 and 5.',
      statusCode: 400,
    });
  }

  try {
    // Check if spot exists
    const spot = await Spots.findByPk(spotId);
    if (!spot) {
      return res.status(404).json({
        message: 'Spot not found',
        statusCode: 404,
      });
    }

    // Check if user has already made a review for this spot
    const existingReview = await Reviews.findOne({
      where: { userId, spotId },
    });
    if (existingReview) {
      return res.status(403).json({
        message: 'User already has a review for this spot',
        statusCode: 403,
      });
    }

    // Create new review
    const newReview = await Reviews.create({
      userId,
      spotId,
      review,
      stars,
    });

    // Return the new review data
    return res.status(201).json({
      id: newReview.id,
      userId: newReview.userId,
      spotId: newReview.spotId,
      review: newReview.review,
      stars: newReview.stars,
      createdAt: newReview.createdAt,
      updatedAt: newReview.updatedAt,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      message: 'Internal server error',
      statusCode: 500,
    });
  }
});

module.exports = router;
