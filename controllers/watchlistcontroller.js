import User from '../models/User.js';
import Stock from '../models/Stock.js';

// @desc    Get user's watchlist
// @route   GET /api/watchlist
export const getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('watchlist subscription');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get detailed stock data for watchlist items
    const watchlistWithDetails = await Promise.all(
      user.watchlist.map(async (item) => {
        try {
          const stock = await Stock.findBySymbol(item.symbol);
          
          if (!stock) {
            return {
              symbol: item.symbol,
              customName: item.customName,
              addedAt: item.addedAt,
              targetPrice: item.targetPrice,
              notes: item.notes,
              error: 'Stock data not available',
              currentPrice: null,
              change: null,
              changePercent: null
            };
          }

          const stockData = stock.toStockJSON();

          return {
            symbol: item.symbol,
            customName: item.customName,
            addedAt: item.addedAt,
            targetPrice: item.targetPrice,
            notes: item.notes,
            currentPrice: stockData.currentPrice.price,
            change: stockData.currentPrice.change,
            changePercent: stockData.currentPrice.changePercent,
            open: stockData.dailyData.open,
            high: stockData.dailyData.high,
            low: stockData.dailyData.low,
            volume: stockData.dailyData.volume,
            companyName: stockData.companyName,
            formattedChange: stockData.formattedChange,
            marketStatus: stockData.marketStatus,
            dailyRangePercent: stockData.dailyRangePercent
          };
        } catch (error) {
          console.error(`Error fetching data for ${item.symbol}:`, error);
          return {
            symbol: item.symbol,
            customName: item.customName,
            addedAt: item.addedAt,
            targetPrice: item.targetPrice,
            notes: item.notes,
            error: 'Failed to fetch stock data',
            currentPrice: null,
            change: null,
            changePercent: null
          };
        }
      })
    );

    // Sort by added date (newest first)
    watchlistWithDetails.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    res.json({
      success: true,
      data: {
        watchlist: watchlistWithDetails,
        summary: {
          total: user.watchlist.length,
          limit: user.subscription.features.maxWatchlistItems,
          available: Math.max(0, user.subscription.features.maxWatchlistItems - user.watchlist.length)
        }
      }
    });

  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching watchlist'
    });
  }
};

// @desc    Add stock to watchlist
// @route   POST /api/watchlist
export const addToWatchlist = async (req, res) => {
  try {
    const { symbol, customName, targetPrice, notes } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if stock exists in our database, if not fetch it
    let stock = await Stock.findBySymbol(symbol);
    if (!stock) {
      try {
        stock = new Stock({
          symbol: symbol.toUpperCase(),
          companyName: symbol,
          exchange: 'NASDAQ',
          currency: 'USD',
          currentPrice: {
            price: 0,
            change: 0,
            changePercent: 0,
            lastUpdated: new Date()
          }
        });
        await stock.save();
      } catch (stockError) {
        console.warn(`Could not create stock record for ${symbol}:`, stockError);
      }
    }

    // Add to watchlist
    await user.addToWatchlist(symbol, customName, targetPrice, notes);

    // Get updated user data
    const updatedUser = await User.findById(req.user.id)
      .select('watchlist subscription');

    const newItem = updatedUser.watchlist.find(item => 
      item.symbol === symbol.toUpperCase()
    );

    // Get stock data for response
    let stockData = null;
    if (stock) {
      stockData = stock.toStockJSON();
    }

    res.status(201).json({
      success: true,
      message: 'Stock added to watchlist successfully',
      data: {
        watchlistItem: {
          symbol: newItem.symbol,
          customName: newItem.customName,
          addedAt: newItem.addedAt,
          targetPrice: newItem.targetPrice,
          notes: newItem.notes,
          currentPrice: stockData?.currentPrice?.price || null,
          change: stockData?.currentPrice?.change || null,
          changePercent: stockData?.currentPrice?.changePercent || null,
          companyName: stockData?.companyName || null
        },
        summary: {
          total: updatedUser.watchlist.length,
          limit: updatedUser.subscription.features.maxWatchlistItems,
          available: Math.max(0, updatedUser.subscription.features.maxWatchlistItems - updatedUser.watchlist.length)
        }
      }
    });

  } catch (error) {
    console.error('Add to watchlist error:', error);
    
    if (error.message.includes('already in watchlist')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Watchlist limit reached')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding to watchlist'
    });
  }
};

// @desc    Remove stock from watchlist
// @route   DELETE /api/watchlist/:symbol
export const removeFromWatchlist = async (req, res) => {
  try {
    const { symbol } = req.params;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if stock exists in watchlist
    if (!user.hasInWatchlist(symbol)) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found in watchlist'
      });
    }

    // Remove from watchlist
    await user.removeFromWatchlist(symbol);

    // Get updated user data
    const updatedUser = await User.findById(req.user.id)
      .select('watchlist subscription');

    res.json({
      success: true,
      message: 'Stock removed from watchlist successfully',
      data: {
        summary: {
          total: updatedUser.watchlist.length,
          limit: updatedUser.subscription.features.maxWatchlistItems,
          available: Math.max(0, updatedUser.subscription.features.maxWatchlistItems - updatedUser.watchlist.length)
        }
      }
    });

  } catch (error) {
    console.error('Remove from watchlist error:', error);
    
    if (error.message.includes('Stock not found in watchlist')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while removing from watchlist'
    });
  }
};

// @desc    Update watchlist item
// @route   PUT /api/watchlist/:symbol
export const updateWatchlistItem = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { customName, targetPrice, notes } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the watchlist item
    const watchlistItem = user.watchlist.find(item => 
      item.symbol === symbol.toUpperCase()
    );

    if (!watchlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found in watchlist'
      });
    }

    // Update fields if provided
    if (customName !== undefined) watchlistItem.customName = customName;
    if (targetPrice !== undefined) watchlistItem.targetPrice = targetPrice;
    if (notes !== undefined) watchlistItem.notes = notes;

    await user.save();

    // Get stock data for response
    const stock = await Stock.findBySymbol(symbol);
    const stockData = stock ? stock.toStockJSON() : null;

    res.json({
      success: true,
      message: 'Watchlist item updated successfully',
      data: {
        watchlistItem: {
          symbol: watchlistItem.symbol,
          customName: watchlistItem.customName,
          addedAt: watchlistItem.addedAt,
          targetPrice: watchlistItem.targetPrice,
          notes: watchlistItem.notes,
          currentPrice: stockData?.currentPrice?.price || null,
          change: stockData?.currentPrice?.change || null,
          changePercent: stockData?.currentPrice?.changePercent || null,
          companyName: stockData?.companyName || null
        }
      }
    });

  } catch (error) {
    console.error('Update watchlist item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating watchlist item'
    });
  }
};