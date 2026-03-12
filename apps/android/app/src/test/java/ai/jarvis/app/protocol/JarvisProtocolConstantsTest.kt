package ai.jarvis.app.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class JarvisProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", JarvisCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", JarvisCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", JarvisCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", JarvisCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", JarvisCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", JarvisCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", JarvisCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", JarvisCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", JarvisCapability.Canvas.rawValue)
    assertEquals("camera", JarvisCapability.Camera.rawValue)
    assertEquals("voiceWake", JarvisCapability.VoiceWake.rawValue)
    assertEquals("location", JarvisCapability.Location.rawValue)
    assertEquals("sms", JarvisCapability.Sms.rawValue)
    assertEquals("device", JarvisCapability.Device.rawValue)
    assertEquals("notifications", JarvisCapability.Notifications.rawValue)
    assertEquals("system", JarvisCapability.System.rawValue)
    assertEquals("photos", JarvisCapability.Photos.rawValue)
    assertEquals("contacts", JarvisCapability.Contacts.rawValue)
    assertEquals("calendar", JarvisCapability.Calendar.rawValue)
    assertEquals("motion", JarvisCapability.Motion.rawValue)
  }

  @Test
  fun cameraCommandsUseStableStrings() {
    assertEquals("camera.list", JarvisCameraCommand.List.rawValue)
    assertEquals("camera.snap", JarvisCameraCommand.Snap.rawValue)
    assertEquals("camera.clip", JarvisCameraCommand.Clip.rawValue)
  }

  @Test
  fun notificationsCommandsUseStableStrings() {
    assertEquals("notifications.list", JarvisNotificationsCommand.List.rawValue)
    assertEquals("notifications.actions", JarvisNotificationsCommand.Actions.rawValue)
  }

  @Test
  fun deviceCommandsUseStableStrings() {
    assertEquals("device.status", JarvisDeviceCommand.Status.rawValue)
    assertEquals("device.info", JarvisDeviceCommand.Info.rawValue)
    assertEquals("device.permissions", JarvisDeviceCommand.Permissions.rawValue)
    assertEquals("device.health", JarvisDeviceCommand.Health.rawValue)
  }

  @Test
  fun systemCommandsUseStableStrings() {
    assertEquals("system.notify", JarvisSystemCommand.Notify.rawValue)
  }

  @Test
  fun photosCommandsUseStableStrings() {
    assertEquals("photos.latest", JarvisPhotosCommand.Latest.rawValue)
  }

  @Test
  fun contactsCommandsUseStableStrings() {
    assertEquals("contacts.search", JarvisContactsCommand.Search.rawValue)
    assertEquals("contacts.add", JarvisContactsCommand.Add.rawValue)
  }

  @Test
  fun calendarCommandsUseStableStrings() {
    assertEquals("calendar.events", JarvisCalendarCommand.Events.rawValue)
    assertEquals("calendar.add", JarvisCalendarCommand.Add.rawValue)
  }

  @Test
  fun motionCommandsUseStableStrings() {
    assertEquals("motion.activity", JarvisMotionCommand.Activity.rawValue)
    assertEquals("motion.pedometer", JarvisMotionCommand.Pedometer.rawValue)
  }
}
