import GoogleSheetsController from './GoogleSheetsController'
import DataSourceController from './DataSourceController'
import SpreadsheetController from './SpreadsheetController'
import DashboardController from './DashboardController'
const Controllers = {
    GoogleSheetsController: Object.assign(GoogleSheetsController, GoogleSheetsController),
DataSourceController: Object.assign(DataSourceController, DataSourceController),
SpreadsheetController: Object.assign(SpreadsheetController, SpreadsheetController),
DashboardController: Object.assign(DashboardController, DashboardController),
}

export default Controllers