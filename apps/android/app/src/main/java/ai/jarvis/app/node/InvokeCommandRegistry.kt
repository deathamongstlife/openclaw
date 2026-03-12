package ai.jarvis.app.node

import ai.jarvis.app.protocol.JarvisCalendarCommand
import ai.jarvis.app.protocol.JarvisCanvasA2UICommand
import ai.jarvis.app.protocol.JarvisCanvasCommand
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

data class NodeRuntimeFlags(
  val cameraEnabled: Boolean,
  val locationEnabled: Boolean,
  val smsAvailable: Boolean,
  val voiceWakeEnabled: Boolean,
  val motionActivityAvailable: Boolean,
  val motionPedometerAvailable: Boolean,
  val debugBuild: Boolean,
)

enum class InvokeCommandAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  MotionActivityAvailable,
  MotionPedometerAvailable,
  DebugBuild,
}

enum class NodeCapabilityAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  VoiceWakeEnabled,
  MotionAvailable,
}

data class NodeCapabilitySpec(
  val name: String,
  val availability: NodeCapabilityAvailability = NodeCapabilityAvailability.Always,
)

data class InvokeCommandSpec(
  val name: String,
  val requiresForeground: Boolean = false,
  val availability: InvokeCommandAvailability = InvokeCommandAvailability.Always,
)

object InvokeCommandRegistry {
  val capabilityManifest: List<NodeCapabilitySpec> =
    listOf(
      NodeCapabilitySpec(name = JarvisCapability.Canvas.rawValue),
      NodeCapabilitySpec(name = JarvisCapability.Device.rawValue),
      NodeCapabilitySpec(name = JarvisCapability.Notifications.rawValue),
      NodeCapabilitySpec(name = JarvisCapability.System.rawValue),
      NodeCapabilitySpec(
        name = JarvisCapability.Camera.rawValue,
        availability = NodeCapabilityAvailability.CameraEnabled,
      ),
      NodeCapabilitySpec(
        name = JarvisCapability.Sms.rawValue,
        availability = NodeCapabilityAvailability.SmsAvailable,
      ),
      NodeCapabilitySpec(
        name = JarvisCapability.VoiceWake.rawValue,
        availability = NodeCapabilityAvailability.VoiceWakeEnabled,
      ),
      NodeCapabilitySpec(
        name = JarvisCapability.Location.rawValue,
        availability = NodeCapabilityAvailability.LocationEnabled,
      ),
      NodeCapabilitySpec(name = JarvisCapability.Photos.rawValue),
      NodeCapabilitySpec(name = JarvisCapability.Contacts.rawValue),
      NodeCapabilitySpec(name = JarvisCapability.Calendar.rawValue),
      NodeCapabilitySpec(
        name = JarvisCapability.Motion.rawValue,
        availability = NodeCapabilityAvailability.MotionAvailable,
      ),
    )

  val all: List<InvokeCommandSpec> =
    listOf(
      InvokeCommandSpec(
        name = JarvisCanvasCommand.Present.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = JarvisCanvasCommand.Hide.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = JarvisCanvasCommand.Navigate.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = JarvisCanvasCommand.Eval.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = JarvisCanvasCommand.Snapshot.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = JarvisCanvasA2UICommand.Push.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = JarvisCanvasA2UICommand.PushJSONL.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = JarvisCanvasA2UICommand.Reset.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = JarvisSystemCommand.Notify.rawValue,
      ),
      InvokeCommandSpec(
        name = JarvisCameraCommand.List.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = JarvisCameraCommand.Snap.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = JarvisCameraCommand.Clip.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = JarvisLocationCommand.Get.rawValue,
        availability = InvokeCommandAvailability.LocationEnabled,
      ),
      InvokeCommandSpec(
        name = JarvisDeviceCommand.Status.rawValue,
      ),
      InvokeCommandSpec(
        name = JarvisDeviceCommand.Info.rawValue,
      ),
      InvokeCommandSpec(
        name = JarvisDeviceCommand.Permissions.rawValue,
      ),
      InvokeCommandSpec(
        name = JarvisDeviceCommand.Health.rawValue,
      ),
      InvokeCommandSpec(
        name = JarvisNotificationsCommand.List.rawValue,
      ),
      InvokeCommandSpec(
        name = JarvisNotificationsCommand.Actions.rawValue,
      ),
      InvokeCommandSpec(
        name = JarvisPhotosCommand.Latest.rawValue,
      ),
      InvokeCommandSpec(
        name = JarvisContactsCommand.Search.rawValue,
      ),
      InvokeCommandSpec(
        name = JarvisContactsCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = JarvisCalendarCommand.Events.rawValue,
      ),
      InvokeCommandSpec(
        name = JarvisCalendarCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = JarvisMotionCommand.Activity.rawValue,
        availability = InvokeCommandAvailability.MotionActivityAvailable,
      ),
      InvokeCommandSpec(
        name = JarvisMotionCommand.Pedometer.rawValue,
        availability = InvokeCommandAvailability.MotionPedometerAvailable,
      ),
      InvokeCommandSpec(
        name = JarvisSmsCommand.Send.rawValue,
        availability = InvokeCommandAvailability.SmsAvailable,
      ),
      InvokeCommandSpec(
        name = "debug.logs",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
      InvokeCommandSpec(
        name = "debug.ed25519",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
    )

  private val byNameInternal: Map<String, InvokeCommandSpec> = all.associateBy { it.name }

  fun find(command: String): InvokeCommandSpec? = byNameInternal[command]

  fun advertisedCapabilities(flags: NodeRuntimeFlags): List<String> {
    return capabilityManifest
      .filter { spec ->
        when (spec.availability) {
          NodeCapabilityAvailability.Always -> true
          NodeCapabilityAvailability.CameraEnabled -> flags.cameraEnabled
          NodeCapabilityAvailability.LocationEnabled -> flags.locationEnabled
          NodeCapabilityAvailability.SmsAvailable -> flags.smsAvailable
          NodeCapabilityAvailability.VoiceWakeEnabled -> flags.voiceWakeEnabled
          NodeCapabilityAvailability.MotionAvailable -> flags.motionActivityAvailable || flags.motionPedometerAvailable
        }
      }
      .map { it.name }
  }

  fun advertisedCommands(flags: NodeRuntimeFlags): List<String> {
    return all
      .filter { spec ->
        when (spec.availability) {
          InvokeCommandAvailability.Always -> true
          InvokeCommandAvailability.CameraEnabled -> flags.cameraEnabled
          InvokeCommandAvailability.LocationEnabled -> flags.locationEnabled
          InvokeCommandAvailability.SmsAvailable -> flags.smsAvailable
          InvokeCommandAvailability.MotionActivityAvailable -> flags.motionActivityAvailable
          InvokeCommandAvailability.MotionPedometerAvailable -> flags.motionPedometerAvailable
          InvokeCommandAvailability.DebugBuild -> flags.debugBuild
        }
      }
      .map { it.name }
  }
}
