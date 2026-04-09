from deepface import DeepFace


class FaceVerifier:
    def __init__(self, reference_img):
        self.reference_img = reference_img
        print("[INFO] DeepFace Verifier & Anti-Spoofing initialized.")

    def verify(self, frame):
        try:
            # 1. NEW: We added anti_spoofing=True to activate MiniFASNet!
            face_objs = DeepFace.extract_faces(
                img_path=frame,
                detector_backend="opencv",
                enforce_detection=False,
                anti_spoofing=True
            )

            valid_faces = [f for f in face_objs if f['confidence'] > 0.8]

            if len(valid_faces) > 1:
                return f"!!! {len(valid_faces)} PEOPLE DETECTED !!!", (0, 0, 255), True,"MULTIPLE_PEOPLE"
            elif len(valid_faces) == 0:
                return "NO FACE DETECTED", (0, 165, 255), False, "NO_FACE"
            else:
                face_data = valid_faces[0]

                # -----------------------------------------
                # 2. NEW: PASSIVE LIVENESS (SPOOF) CHECK
                # -----------------------------------------
                is_real = face_data.get("is_real", True)

                if not is_real:
                    # If it detects a phone screen (Moiré pattern) or printed photo
                    return "SPOOF DETECTED (FAKE FACE)", (0, 0, 255), True, "SPOOF"

                # -----------------------------------------
                # 3. IDENTITY VERIFICATION
                # -----------------------------------------
                res = DeepFace.verify(
                    img1_path=frame,
                    img2_path=self.reference_img,
                    detector_backend="opencv",
                    enforce_detection=False
                )

                if res["verified"]:
                    return "IDENTITY VERIFIED", (0, 255, 0),False,"OK"
                else:
                    return "UNKNOWN PERSON", (0, 0, 255),True,"UNKNOWN_PERSON"

        except Exception:
            return "NO FACE DETECTED", (0, 165, 255), False, "NO_FACE"