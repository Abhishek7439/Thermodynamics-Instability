import unittest
from server import generate_tephigram

class TestTephigramRegression(unittest.TestCase):
    def test_normal_sounding(self):
        temps = [(1000, 20), (850, 10), (700, 0), (500, -20)]
        dews = [(1000, 15), (850, 5), (700, -10), (500, -30)]
        barbs = [(10, 270, 1000), (20, 280, 850), (30, 290, 700), (40, 300, 500)]
        b64, err = generate_tephigram(temps, dews, barbs)
        self.assertIsNotNone(b64)
        self.assertIsNone(err)

    def test_missing_winds(self):
        temps = [(1000, 20), (850, 10), (700, 0), (500, -20)]
        dews = [(1000, 15), (850, 5), (700, -10), (500, -30)]
        barbs = []
        b64, err = generate_tephigram(temps, dews, barbs)
        self.assertIsNotNone(b64)
        self.assertIsNone(err)

    def test_short_terminated_sounding(self):
        temps = [(1000, 20)]
        dews = [(1000, 15)]
        barbs = []
        b64, err = generate_tephigram(temps, dews, barbs)
        self.assertIsNone(b64)
        self.assertIsNotNone(err)
        self.assertIn("Insufficient data points", err)

    def test_duplicate_pressures(self):
        # The filter should skip the duplicate 850 and plot successfully
        temps = [(1000, 20), (850, 10), (850, 10), (700, 0), (500, -20)]
        dews = [(1000, 15), (850, 5), (850, 5), (700, -10), (500, -30)]
        barbs = []
        b64, err = generate_tephigram(temps, dews, barbs)
        self.assertIsNotNone(b64)
        self.assertIsNone(err)

    def test_increasing_pressures(self):
        # Pressure jumps back up (invalid physical profile line)
        temps = [(1000, 20), (850, 10), (900, 15), (700, 0), (500, -20)]
        dews = [(1000, 15), (850, 5), (900, 10), (700, -10), (500, -30)]
        barbs = []
        b64, err = generate_tephigram(temps, dews, barbs)
        self.assertIsNotNone(b64)
        self.assertIsNone(err)

if __name__ == '__main__':
    unittest.main()
