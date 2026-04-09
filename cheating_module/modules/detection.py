from ultralytics import YOLO


class ObjectDetector:
    def __init__(self, model_path):
        self.model = YOLO(model_path)

    def analyze(self, frame):
        results = self.model.track(frame, verbose=False)  # adds tracking
        objects = []
        device_seen = False

        for r in results:
            for box in r.boxes:
                # 60% confidence threshold
                if box.conf > 0.60:
                    device_seen = True
                    # Scale coordinates back up (because main thread shrinks frame by 0.5)
                    x1, y1, x2, y2 = [int(val / 0.5) for val in box.xyxy[0]]
                    objects.append((x1, y1, x2, y2, float(box.conf)))

        return objects, device_seen