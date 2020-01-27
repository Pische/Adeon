using System;
using Foundation;
using UIKit;
using CoreGraphics;
using AVFoundation;
using WikitudeComponent.iOS;
using Adeon.iOS.CoreServices;



namespace Adeon.iOS
{
    public partial class ViewController : UIViewController
    {
        protected WTArchitectView architectView;

        [Weak]
        protected WTNavigation loadedArExperienceNavigation;
        protected WTNavigation loadingArExperienceNavigation;

        protected NSObject applicationWillResignActiveObserver;
        protected NSObject applicationDidBecomeActiveObserver;

        private WTAuthorizationRequestManager authorizationRequestManager =
            new WTAuthorizationRequestManager();

        protected bool isRunning;

        public override void ViewDidLoad()
        {
            base.ViewDidLoad();

            architectView = new WTArchitectView();
            architectView.SetLicenseKey("nOWpqguR1RdC+q9h0BF0uNibUThZg288B" +
                "2lgjTgv84TNLE7MtqmJ6BlheG7XEG4GQelAwtgj4CRVJWw1dR2Seto7le" +
                "ZahvvF2JM16d3P8SqTgUvdDZyvKV9m3mD5Qh9nXmaUWcUBU75kCU4o+EI" +
                "RkV1ZSgwvY/hPytsrzIW5iXlTYWx0ZWRfX21XYTkzCZni0X6HvP90/Xbu" +
                "VlzHURC27ySO32WnIOYy9yP4oExzemrEDve+iOa5ceAc27628nnPLIWUW" +
                "scAGBLA1SFOVXQzyaJtyShuJN4FMfoEy265m/1dEFdJdLel+jFiZqAofx" +
                "d3WDrBzOX+bpyuc3A6cIjN9KAdvFdbqQvjfL5ncLe9zeekc5N5PJESwwG" +
                "6+zBS4iTZMwBgPZYON+PSxhEuJ/wMvYVdKbn8EQNgTWb7sWIoSno0ADTX" +
                "62qxDGy5PhuAl4sk7ksefUirANtuxKrIb+7QUl57FOBtCLigWDzLeG+Ci" +
                "g+ZKGPPxWUNYOD5h1XJdoZRK1a+rbWiko3Bdzz13XHxhAVoKJvDo22e09" +
                "aeYkgGiLayjvkb+hT3I/+OeBrw1T+FnACWU+Bw9+3iQF06LZYEiCH/4S+" +
                "EpQ4ggIPZZYszNvMZenFhR7WCWySKBne2aja79KlsXUyO0q03YoQRXmv7" +
                "Gzuy1ahJlihgFMyf94/Q/uo2+xXoXXwjU5BXEXzgQWWwo5vyYWpKKGk9b" +
                "c8FogsuCxklmh7KJ0ZMbg++uBiL+H8=");
            architectView.RequiredFeatures = WTFeatures.Geo;
            architectView.TranslatesAutoresizingMaskIntoConstraints = false;
            Add(architectView);

            architectView.CenterXAnchor.ConstraintEqualTo(View.CenterXAnchor).Active = true;
            architectView.CenterYAnchor.ConstraintEqualTo(View.CenterYAnchor).Active = true;
            architectView.WidthAnchor.ConstraintEqualTo(View.WidthAnchor).Active = true;
            architectView.HeightAnchor.ConstraintEqualTo(View.HeightAnchor).Active = true;

            EdgesForExtendedLayout = UIRectEdge.None;
        }

        public override void ViewWillAppear(bool animated)
        {
            base.ViewWillAppear(animated);

            /*  Controllo sul primo avvio dell'app sul dispositivo per mostrare
                il tutorial o meno
             */
            string firstTime = "" + NSUserDefaults.StandardUserDefaults.BoolForKey("FirstTime");
            string fn = "";
            if (firstTime == "False"){
                fn = "World.setFirstTime(true);";
            }
            else
            {
                fn = "World.setFirstTime(false);";
            }

            LoadArExperience();
            StartArchitectViewRendering();
            architectView.CallJavaScript(fn);
            //architectView.CallJavaScript("World.setFirstTime(false);"); //sostituzione momentanea

            if (firstTime == "False")
            {
                NSUserDefaults.StandardUserDefaults.SetBool(true, "FirstTime");
            }

            applicationWillResignActiveObserver = NSNotificationCenter.DefaultCenter.AddObserver(UIApplication.WillResignActiveNotification, ApplicationWillResignActive);
            applicationDidBecomeActiveObserver = NSNotificationCenter.DefaultCenter.AddObserver(UIApplication.DidBecomeActiveNotification, ApplicationDidBecomeActive);
        }


        public override void ViewDidDisappear(bool animated)
        {
            base.ViewDidDisappear(animated);


            //rilascia la variabile per i test, così è sempre come se fosse il primo avvio
            /*if ("" + NSUserDefaults.StandardUserDefaults.BoolForKey("FirstTime") == "False")
            {
                NSUserDefaults.StandardUserDefaults.SetBool(true, "FirstTime");
            }*/

            StopArchitectViewRendering();



            NSNotificationCenter.DefaultCenter.RemoveObserver(applicationWillResignActiveObserver);
            NSNotificationCenter.DefaultCenter.RemoveObserver(applicationDidBecomeActiveObserver);
        }

        public override void DidReceiveMemoryWarning()
        {
            base.DidReceiveMemoryWarning();
            // Release any cached data, images, etc that aren't in use.
        }

        public void ArchitectWorldFinishedLoading(WTNavigation navigation)
        {
            if (loadingArExperienceNavigation.Equals(navigation))
            {
                loadedArExperienceNavigation = navigation;
            }
        }

        #region Notifications
        private void ApplicationWillResignActive(NSNotification notification)
        {
            StopArchitectViewRendering();
        }

        private void ApplicationDidBecomeActive(NSNotification notification)
        {
            StartArchitectViewRendering();
        }
        #endregion

        #region Private Methods
        private void LoadArExperience()
        {
            ArExperienceAuthorizationController.AuthorizeRestricedAPIAccess(authorizationRequestManager, WTFeatures.Geo, () => {
                NSUrl fullArExperienceURL = NSBundle.MainBundle.GetUrlForResource("index", "html", "Milan");
                loadingArExperienceNavigation = architectView.LoadArchitectWorldFromURL(fullArExperienceURL);
            }, (UIAlertController alertController) => {
                PresentViewController(alertController, true, null);
            });
        }

        private void StartArchitectViewRendering()
        {
            if (!architectView.IsRunning)
            {
                architectView.Start((WTArchitectStartupConfiguration architectStartupConfiguration) =>
                {
                    architectStartupConfiguration.CaptureDevicePosition = AVCaptureDevicePosition.Back;
                    architectStartupConfiguration.CaptureDeviceResolution = WTCaptureDeviceResolution.WTCaptureDeviceResolution_AUTO;
                    architectStartupConfiguration.CaptureDeviceFocusMode = AVCaptureFocusMode.ContinuousAutoFocus;
                }, (bool success, NSError error) =>
                {
                    isRunning = success;
                });
            }
        }

        private void StopArchitectViewRendering()
        {
            if (isRunning)
            {
                NSUserDefaults.StandardUserDefaults.RemoveObject("FirstTime");
                architectView.Stop();
            }
        }
        #endregion

        public ViewController(IntPtr handle) : base(handle)
        {

        }
    }
}