import { app, BrowserWindow, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

/**
 * Auto-updater module for EVM Wallet
 * 
 * Features:
 * - Check for updates at startup
 * - Periodic check every 30 minutes
 * - User confirmation before download
 * - Progress tracking (taskbar + renderer)
 * - Auto-restart after installation
 * 
 * Events emitted to renderer:
 * - update-progress: { percent: number } - download progress
 */

// Configure logging
log.transports.file.level = 'info'
log.transports.console.level = 'info'

// Configure auto-updater
autoUpdater.logger = log
autoUpdater.autoDownload = false

let updateAvailableInfo: any = null

/**
 * Initialize auto-updater for the application
 * Should be called in app.whenReady() after createWindow()
 */
export const initAutoUpdater = (mainWindow: BrowserWindow): void => {
  if (!mainWindow) {
    log.error('initAutoUpdater called with null mainWindow')
    return
  }

  log.info('Initializing auto-updater')

  // ─── Update Available ──────────────────────────────────────────────
  autoUpdater.on('update-available', (info: any) => {
    log.info(`Update available: ${info.version}`, {
      currentVersion: app.getVersion(),
      newVersion: info.version
    })
    updateAvailableInfo = info

    const currentVersion = app.getVersion()
    const newVersion = info.version

    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `A new version is available: ${newVersion}`,
        detail: `You are currently on version ${currentVersion}.\n\nWould you like to download and install the update?`,
        buttons: ['Download', 'Remind Later'],
        defaultId: 0
      })
      .then((result) => {
        if (result.response === 0) {
          // User clicked "Download"
          log.info('User accepted update, starting download')
          autoUpdater.downloadUpdate()
        } else {
          // User clicked "Remind Later"
          updateAvailableInfo = null
          log.info('User deferred update')
        }
      })
      .catch((err: any) => {
        log.error('Error showing update available dialog', err)
      })
  })

  // ─── Update Not Available ──────────────────────────────────────────
  autoUpdater.on('update-not-available', (info: any) => {
    log.info('No update available', { currentVersion: app.getVersion() })
  })

  // ─── Download Progress ────────────────────────────────────────────
  autoUpdater.on('download-progress', (progress: any) => {
    const percent = Math.round((progress.transferred / progress.total) * 100)
    log.info(`Download progress: ${percent}%`)

    // Send progress to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-progress', { percent })
      // Update taskbar progress
      mainWindow.setProgressBar(percent / 100)
    }
  })

  // ─── Update Downloaded ────────────────────────────────────────────
  autoUpdater.on('update-downloaded', (info: any) => {
    log.info('Update downloaded successfully', {
      version: info.version,
      path: info.path
    })

    // Reset taskbar progress
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setProgressBar(-1)
    }

    const newVersion = info.version
    const currentVersion = app.getVersion()

    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready to Install',
        message: `Version ${newVersion} has been downloaded`,
        detail: `A new version is ready to install. The app will restart to complete the installation.`,
        buttons: ['Restart Now', 'Later'],
        defaultId: 0
      })
      .then((result) => {
        if (result.response === 0) {
          // User clicked "Restart Now"
          log.info('Quitting and installing update')
          setImmediate(() => autoUpdater.quitAndInstall())
        } else {
          // User clicked "Later"
          log.info('User deferred restart')
          updateAvailableInfo = null
        }
      })
      .catch((err: any) => {
        log.error('Error showing update ready dialog', err)
      })
  })

  // ─── Update Error ────────────────────────────────────────────────
  autoUpdater.on('error', (error: any) => {
    log.error('Auto-updater error', {
      message: error.message,
      stack: error.stack
    })

    // Reset taskbar progress
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setProgressBar(-1)
    }

    // Show actual error message for debugging
    dialog
      .showMessageBox(mainWindow, {
        type: 'error',
        title: 'Update Error',
        message: 'Failed to download or check for updates',
        detail: `Error: ${error.message}\n\nPlease try again later or check your internet connection.`,
        buttons: ['OK']
      })
      .catch((err: any) => {
        log.error('Error showing update error dialog', err)
      })
  })

  // ─── Check for updates on startup ──────────────────────────────────
  log.info('Checking for updates')
  autoUpdater
    .checkForUpdates()
    .catch((err: any) => {
      log.error('Failed to check for updates', err)
    })

  // ─── Periodic update check (every 30 minutes) ──────────────────────
  setInterval(() => {
    log.info('Periodic update check')
    autoUpdater
      .checkForUpdates()
      .catch((err: any) => {
        log.error('Failed to check for updates (periodic)', err)
      })
  }, 30 * 60 * 1000)
}
