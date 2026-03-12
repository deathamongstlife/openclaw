package ai.jarvis.app.node

import ai.jarvis.app.protocol.JarvisCalendarCommand
import ai.jarvis.app.protocol.JarvisCameraCommand
import ai.jarvis.app.protocol.JarvisCapability
import ai.jarvis.app.protocol.JarvisContactsCommand
import ai.jarvis.app.protocol.JarvisDeviceCommand
import ai.jarvis.app.protocol.JarvisLocationCommand
import ai.jarvis.app.protocol.JarvisMotionCommand
import ai.jarvis.app.protocol.JarvisNotificationsCommand
import ai.jarvis.app.protocol.JarvisPhotosCommand
import ai.jarvis.app.protocol.JarvisSmsCommand
import ai.jarvis.app.protocol.JarvisSystemCommand
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class InvokeCommandRegistryTest {
  private val coreCapabilities =
    setOf(
      JarvisCapability.Canvas.rawValue,
      JarvisCapability.Device.rawValue,
      JarvisCapability.Notifications.rawValue,
      JarvisCapability.System.rawValue,
      JarvisCapability.Photos.rawValue,
      JarvisCapability.Contacts.rawValue,
      JarvisCapability.Calendar.rawValue,
    )

  private val optionalCapabilities =
    setOf(
      JarvisCapability.Camera.rawValue,
      JarvisCapability.Location.rawValue,
      JarvisCapability.Sms.rawValue,
      JarvisCapability.VoiceWake.rawValue,
      JarvisCapability.Motion.rawValue,
    )

  private val coreCommands =
    setOf(
      JarvisDeviceCommand.Status.rawValue,
      JarvisDeviceCommand.Info.rawValue,
      JarvisDeviceCommand.Permissions.rawValue,
      JarvisDeviceCommand.Health.rawValue,
      JarvisNotificationsCommand.List.rawValue,
      JarvisNotificationsCommand.Actions.rawValue,
      JarvisSystemCommand.Notify.rawValue,
      JarvisPhotosCommand.Latest.rawValue,
      JarvisContactsCommand.Search.rawValue,
      JarvisContactsCommand.Add.rawValue,
      JarvisCalendarCommand.Events.rawValue,
      JarvisCalendarCommand.Add.rawValue,
    )

  private val optionalCommands =
    setOf(
      JarvisCameraCommand.Snap.rawValue,
      JarvisCameraCommand.Clip.rawValue,
      JarvisCameraCommand.List.rawValue,
      JarvisLocationCommand.Get.rawValue,
      JarvisMotionCommand.Activity.rawValue,
      JarvisMotionCommand.Pedometer.rawValue,
      JarvisSmsCommand.Send.rawValue,
    )

  private val debugCommands = setOf("debug.logs", "debug.ed25519")

  @Test
  fun advertisedCapabilities_respectsFeatureAvailability() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags())

    assertContainsAll(capabilities, coreCapabilities)
    assertMissingAll(capabilities, optionalCapabilities)
  }

  @Test
  fun advertisedCapabilities_includesFeatureCapabilitiesWhenEnabled() {
    val capabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          smsAvailable = true,
          voiceWakeEnabled = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
        ),
      )

    assertContainsAll(capabilities, coreCapabilities + optionalCapabilities)
  }

  @Test
  fun advertisedCommands_respectsFeatureAvailability() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags())

    assertContainsAll(commands, coreCommands)
    assertMissingAll(commands, optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_includesFeatureCommandsWhenEnabled() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          smsAvailable = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
          debugBuild = true,
        ),
      )

    assertContainsAll(commands, coreCommands + optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_onlyIncludesSupportedMotionCommands() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        NodeRuntimeFlags(
          cameraEnabled = false,
          locationEnabled = false,
          smsAvailable = false,
          voiceWakeEnabled = false,
          motionActivityAvailable = true,
          motionPedometerAvailable = false,
          debugBuild = false,
        ),
      )

    assertTrue(commands.contains(JarvisMotionCommand.Activity.rawValue))
    assertFalse(commands.contains(JarvisMotionCommand.Pedometer.rawValue))
  }

  private fun defaultFlags(
    cameraEnabled: Boolean = false,
    locationEnabled: Boolean = false,
    smsAvailable: Boolean = false,
    voiceWakeEnabled: Boolean = false,
    motionActivityAvailable: Boolean = false,
    motionPedometerAvailable: Boolean = false,
    debugBuild: Boolean = false,
  ): NodeRuntimeFlags =
    NodeRuntimeFlags(
      cameraEnabled = cameraEnabled,
      locationEnabled = locationEnabled,
      smsAvailable = smsAvailable,
      voiceWakeEnabled = voiceWakeEnabled,
      motionActivityAvailable = motionActivityAvailable,
      motionPedometerAvailable = motionPedometerAvailable,
      debugBuild = debugBuild,
    )

  private fun assertContainsAll(actual: List<String>, expected: Set<String>) {
    expected.forEach { value -> assertTrue(actual.contains(value)) }
  }

  private fun assertMissingAll(actual: List<String>, forbidden: Set<String>) {
    forbidden.forEach { value -> assertFalse(actual.contains(value)) }
  }
}
