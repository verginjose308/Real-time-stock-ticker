import Stock from '../models/Stock.js';
import { StockDataService } from '../services/stockService.js';

const stockService = new StockDataService();

// @desc    Get stock data by symbol
// @route   GET /api/stocks/:symbol
export const getStock = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { refresh = 'false' } = req.query;
    const shouldRefresh = refresh === 'true';

    // Try to find stock in database first
    let stock = await Stock.findBySymbol(symbol);

    // If stock doesn't exist or we need fresh data, fetch from API
    if (!stock || shouldRefresh || (stock && isDataStale(stock.currentPrice.lastUpdated))) {
      try {
        const freshData = await stockService.fetchFromAlphaVantage(symbol);
        const companyOverview = await stockService.fetchCompanyOverview(symbol);

        if (stock) {
          // Update existing stock
          await stock.updateCurrentPrice({
            price: freshData.price,
            change: freshData.change,
            changePercent: freshData.changePercent
          });

          await stock.updateDailyData({
            open: freshData.open,
            high: freshData.high,
            low: freshData.low,
            close: freshData.price,
            volume: freshData.volume,
            previousClose: freshData.previousClose
          });

          if (companyOverview) {
            stock.companyInfo = {
              ...stock.companyInfo,
              sector: companyOverview.sector,
              industry: companyOverview.industry,
              description: companyOverview.description,
              CEO: companyOverview.CEO,
              employees: companyOverview.employees,
              country: companyOverview.country
            };

            stock.historicalSummary = {
              week52High: companyOverview.week52High,
              week52Low: companyOverview.week52Low,
              marketCap: companyOverview.marketCap,
              peRatio: companyOverview.peRatio,
              dividendYield: companyOverview.dividendYield,
              avgVolume: freshData.volume
            };
          }

          await stock.save();
        } else {
          // Create new stock record
          stock = new Stock({
            symbol: freshData.symbol,
            companyName: companyOverview?.companyName || symbol,
            exchange: 'NASDAQ',
            currency: 'USD',
            currentPrice: {
              price: freshData.price,
              change: freshData.change,
              changePercent: freshData.changePercent,
              lastUpdated: new Date()
            },
            dailyData: {
              open: freshData.open,
              high: freshData.high,
              low: freshData.low,
              close: freshData.price,
              volume: freshData.volume,
              previousClose: freshData.previousClose,
              date: new Date()
            }
          });

          if (companyOverview) {
            stock.companyInfo = {
              sector: companyOverview.sector,
              industry: companyOverview.industry,
              description: companyOverview.description,
              CEO: companyOverview.CEO,
              employees: companyOverview.employees,
              country: companyOverview.country
            };

            stock.historicalSummary = {
              week52High: companyOverview.week52High,
              week52Low: companyOverview.week52Low,
              marketCap: companyOverview.marketCap,
              peRatio: companyOverview.peRatio,
              dividendYield: companyOverview.dividendYield,
              avgVolume: freshData.volume
            };
          }

          await stock.save();
        }

        // Refetch to get the updated document with virtuals
        stock = await Stock.findBySymbol(symbol);
      } catch (apiError) {
        if (!stock) {
          throw new Error(`Failed to fetch data for symbol: ${symbol}`);
        }
        console.warn('API failed, returning cached data for:', symbol);
      }
    }

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock not found: ${symbol}`
      });
    }

    // Check if user has this stock in watchlist
    let inWatchlist = false;
    if (req.user) {
      inWatchlist = req.user.hasInWatchlist(symbol);
    }

    const stockData = stock.toStockJSON();
    stockData.inWatchlist = inWatchlist;

    res.json({
      success: true,
      data: {
        stock: stockData,
        cached: !shouldRefresh && !isDataStale(stock.currentPrice.lastUpdated)
      }
    });

  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching stock data'
    });
  }
};

// @desc    Search stocks by symbol or company name
// @route   GET /api/stocks/search
export const searchStocks = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    // Search in database first
    const dbResults = await Stock.searchStocks(q, parseInt(limit));

    // If we have enough results, return them
    if (dbResults.length >= parseInt(limit)) {
      return res.json({
        success: true,
        data: {
          stocks: dbResults,
          source: 'database'
        }
      });
    }

    // Otherwise, search external API
    const apiResults = await stockService.searchStocks(q);
    
    // Combine and deduplicate results
    const combinedResults = [...dbResults];
    const dbSymbols = new Set(dbResults.map(stock => stock.symbol));

    for (const apiStock of apiResults) {
      if (!dbSymbols.has(apiStock.symbol) && combinedResults.length < parseInt(limit)) {
        combinedResults.push({
          symbol: apiStock.symbol,
          companyName: apiStock.companyName,
          type: apiStock.type,
          currency: apiStock.currency
        });
      }
    }

    res.json({
      success: true,
      data: {
        stocks: combinedResults,
        source: 'mixed'
      }
    });

  } catch (error) {
    console.error('Search stocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching stocks'
    });
  }
};

// @desc    Get multiple stocks by symbols
// @route   GET /api/stocks/batch/:symbols
export const getBatchStocks = async (req, res) => {
  try {
    const { symbols } = req.params;
    const symbolList = symbols.split(',').slice(0, 10);
    
    if (symbolList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one stock symbol is required'
      });
    }

    const stocks = await Stock.findBySymbols(symbolList);
    
    // Fetch any missing stocks from API
    const existingSymbols = new Set(stocks.map(stock => stock.symbol));
    const missingSymbols = symbolList.filter(sym => !existingSymbols.has(sym.toUpperCase()));
    
    const fetchedStocks = [];
    for (const symbol of missingSymbols) {
      try {
        const freshData = await stockService.fetchFromAlphaVantage(symbol);
        
        const newStock = new Stock({
          symbol: freshData.symbol,
          companyName: symbol,
          exchange: 'NASDAQ',
          currency: 'USD',
          currentPrice: {
            price: freshData.price,
            change: freshData.change,
            changePercent: freshData.changePercent,
            lastUpdated: new Date()
          },
          dailyData: {
            open: freshData.open,
            high: freshData.high,
            low: freshData.low,
            close: freshData.price,
            volume: freshData.volume,
            previousClose: freshData.previousClose,
            date: new Date()
          }
        });

        await newStock.save();
        fetchedStocks.push(newStock);
      } catch (apiError) {
        console.warn(`Failed to fetch ${symbol}:`, apiError.message);
      }
    }

    const allStocks = [...stocks, ...fetchedStocks];
    const stockData = allStocks.map(stock => stock.toStockJSON());

    res.json({
      success: true,
      data: {
        stocks: stockData,
        count: stockData.length
      }
    });

  } catch (error) {
    console.error('Batch stocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batch stocks'
    });
  }
};

// @desc    Get top gainers
// @route   GET /api/stocks/market/gainers
export const getTopGainers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const gainers = await Stock.getTopGainers(parseInt(limit));

    res.json({
      success: true,
      data: {
        stocks: gainers,
        count: gainers.length
      }
    });

  } catch (error) {
    console.error('Get gainers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching top gainers'
    });
  }
};

// @desc    Get top losers
// @route   GET /api/stocks/market/losers
export const getTopLosers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const losers = await Stock.getTopLosers(parseInt(limit));

    res.json({
      success: true,
      data: {
        stocks: losers,
        count: losers.length
      }
    });

  } catch (error) {
    console.error('Get losers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching top losers'
    });
  }
};

// @desc    Get most active stocks
// @route   GET /api/stocks/market/active
export const getMostActive = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const activeStocks = await Stock.getMostActive(parseInt(limit));

    res.json({
      success: true,
      data: {
        stocks: activeStocks,
        count: activeStocks.length
      }
    });

  } catch (error) {
    console.error('Get active stocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching most active stocks'
    });
  }
};

// Helper function to check if data is stale
function isDataStale(lastUpdated) {
  if (!lastUpdated) return true;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return lastUpdated < fiveMinutesAgo;
}